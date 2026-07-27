using JsonEditor.Services;
using Xunit;

namespace Jyxr.ModEditor.Tests;

public sealed class GodotSkillAnimationCatalogTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"jyxr-editor-tests-{Guid.NewGuid():N}");

    [Fact]
    public void Load_ParsesGodot47UidAndReorderedAttributes()
    {
        WriteFixture(
            "[ext_resource id=\"atlas\" uid=\"uid://example\" path=\"res://assets/art/atlas/effect.png\" type=\"Texture2D\"]");

        var manifest = GodotSkillAnimationCatalog.Load("effect", _root);

        Assert.True(manifest.Previewable);
        var frame = Assert.Single(manifest.Frames);
        Assert.Equal("art/atlas/effect.png", frame.AtlasPath);
        Assert.Equal(32, frame.RegionWidth);
        Assert.Empty(manifest.Diagnostics);
    }

    [Fact]
    public void List_ValidatesTheCompleteAtlasDependencyChain()
    {
        WriteFixture(
            "[ext_resource type=\"Texture2D\" uid=\"uid://example\" path=\"res://assets/art/atlas/missing.png\" id=\"atlas\"]",
            createAtlasImage: false);

        var summary = Assert.Single(GodotSkillAnimationCatalog.List(_root));

        Assert.False(summary.Previewable);
        Assert.Equal("invalid", summary.Status);
        Assert.Contains("图集图片不存在", summary.Message);
    }

    private void WriteFixture(string atlasExtResource, bool createAtlasImage = true)
    {
        var animationDirectory = Path.Combine(_root, "animation", "skill");
        var textureDirectory = Path.Combine(_root, "art", "atlas_texture", "effect-skill");
        var atlasDirectory = Path.Combine(_root, "art", "atlas");
        Directory.CreateDirectory(animationDirectory);
        Directory.CreateDirectory(textureDirectory);
        Directory.CreateDirectory(atlasDirectory);

        File.WriteAllText(Path.Combine(animationDirectory, "effect.tres"), """
            [gd_resource type="AnimationLibrary" format=3]

            [ext_resource type="Texture2D" path="res://assets/art/atlas_texture/effect-skill/frame.tres" id="frame"]

            [sub_resource type="Animation" id="animation"]
            length = 0.1
            tracks/0/type = "value"
            tracks/0/keys = {
            "times": PackedFloat32Array(0),
            "values": [ExtResource("frame")]
            }

            [resource]
            _data = {
            &"default": SubResource("animation")
            }
            """);
        File.WriteAllText(Path.Combine(textureDirectory, "frame.tres"), $$"""
            [gd_resource type="AtlasTexture" format=3]

            {{atlasExtResource}}

            [resource]
            atlas = ExtResource("atlas")
            region = Rect2(0, 0, 32, 48)
            """);
        if (createAtlasImage)
        {
            File.WriteAllBytes(Path.Combine(atlasDirectory, "effect.png"), [0]);
        }
    }

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }
}

public sealed class ContentContractCatalogTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"jyxr-contract-tests-{Guid.NewGuid():N}");
    private readonly ContentContractCatalog _catalog;

    public ContentContractCatalogTests()
    {
        _catalog = ContentContractCatalog.Load(FindContractPath());
        Directory.CreateDirectory(_root);
        foreach (var contentFile in _catalog.Contract.RequiredContentFiles)
        {
            File.WriteAllText(
                Path.Combine(_root, contentFile.Path),
                string.Equals(contentFile.Path, "game-config.json", StringComparison.Ordinal) ? "{}" : "[]");
        }
    }

    [Fact]
    public void Validate_AcceptsTypesExportedByTheGameContract()
    {
        File.WriteAllText(Path.Combine(_root, "scoped-battle-effects.json"), """
            [
              {"id": "formation", "scope": {"type": "explicit_units"}},
            ]
            """);
        File.WriteAllText(Path.Combine(_root, "talents.json"), """
            [/* JSONC is accepted by the game loader. */ {
              "id": "test",
              "name": "test",
              "affixes": [{
                "type": "hook", // stable runtime timing
                "timing": "OnDefeated",
                "conditions": [{"type": "context_skill_source_id", "sourceSkillIds": ["skill"]}],
                "effects": [{"type": "grant_scoped_battle_effect", "effectId": "formation"}]
              }]
            },]
            """);

        var result = _catalog.Validate(_root);

        Assert.Equal(0, result.ErrorCount);
    }

    [Fact]
    public void Validate_ReportsMissingItemTagScopedEffectAndShopRewardReferences()
    {
        File.WriteAllText(Path.Combine(_root, "items.json"), """
            [{
              "category": "normal", "id": "item", "name": "item", "consumeOnUse": true,
              "tagIds": ["missing-tag"]
            }]
            """);
        File.WriteAllText(Path.Combine(_root, "talents.json"), """
            [{
              "id": "talent", "name": "talent",
              "affixes": [{"type": "hook", "timing": "OnBattleStart", "effects": [
                {"type": "grant_scoped_battle_effect", "effectId": "missing-effect"}
              ]}]
            }]
            """);
        File.WriteAllText(Path.Combine(_root, "shops.json"), """
            [{
              "id": "shop", "name": "shop",
              "products": [{"reward": {"kind": "item", "itemId": "missing-shop-item", "quantity": 1}}]
            }]
            """);

        var result = _catalog.Validate(_root);

        Assert.Contains(result.Issues, issue => issue.Code == "contract.reference-missing" && issue.Message.Contains("missing-tag"));
        Assert.Contains(result.Issues, issue => issue.Code == "contract.reference-missing" && issue.Message.Contains("missing-effect"));
        Assert.Contains(result.Issues, issue => issue.Code == "contract.reference-missing" && issue.Message.Contains("missing-shop-item"));
    }

    [Fact]
    public void Validate_ReportsMissingWorldTriggerTargetsAndUnknownTypes()
    {
        File.WriteAllText(Path.Combine(_root, "world-triggers.json"), """
            [
              {"id": "shop", "type": "shop", "targetId": "missing-shop"},
              {"id": "battle", "type": "battle", "targetId": "missing-battle"},
              {"id": "future", "type": "future", "targetId": "target"},
              {"id": "chest", "type": "xiangzi"}
            ]
            """);

        var result = _catalog.Validate(_root);

        Assert.Contains(result.Issues, issue => issue.Code == "contract.reference-missing" && issue.Message.Contains("missing-shop"));
        Assert.Contains(result.Issues, issue => issue.Code == "contract.reference-missing" && issue.Message.Contains("missing-battle"));
        Assert.Contains(result.Issues, issue => issue.Code == "contract.unknown-world-trigger-type");
        Assert.DoesNotContain(result.Issues, issue => issue.Path == "world-triggers.json[3].targetId");
    }

    [Fact]
    public void Validate_SeparatesSyntaxAndContractFailures()
    {
        File.WriteAllText(Path.Combine(_root, "talents.json"), "[{\"affixes\":[{\"type\":\"future_affix\"}]}]");
        File.WriteAllText(Path.Combine(_root, "maps.json"), "[");

        var result = _catalog.Validate(_root);

        Assert.Contains(result.Issues, issue => issue.Category == "contract" && issue.Code == "contract.unknown-discriminator");
        Assert.Contains(result.Issues, issue => issue.Category == "contract" && issue.Code == "contract.required-field");
        Assert.Contains(result.Issues, issue => issue.Category == "syntax" && issue.Code == "syntax.json");
    }

    private static string FindContractPath()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "src", "Jyxr.ModEditor", "Contracts", "jyxr-content-contract.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new FileNotFoundException("Unable to locate the checked-in editor content contract.");
    }

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }
}

public sealed class GameWorkspaceCompatibilityTests
{
    [Fact]
    public void CurrentGameWorkspaceMatchesTheCheckedInContractAndPreviewsAllTextAnimations()
    {
        var gameRoot = Environment.GetEnvironmentVariable("JYXR_GAME_ROOT");
        if (string.IsNullOrWhiteSpace(gameRoot))
        {
            return;
        }

        var catalog = ContentContractCatalog.Load(FindContractPath());
        var validation = catalog.Validate(Path.Combine(gameRoot, "mods", "jyxr-base", "data"));
        var animations = GodotSkillAnimationCatalog.List(Path.Combine(gameRoot, "assets"));

        Assert.DoesNotContain(validation.Issues, issue => issue.Severity == "error");
        Assert.NotEmpty(animations);
        Assert.DoesNotContain(animations, animation =>
            string.Equals(Path.GetExtension(animation.Path), ".tres", StringComparison.OrdinalIgnoreCase) &&
            !animation.Previewable);
    }

    private static string FindContractPath()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "src", "Jyxr.ModEditor", "Contracts", "jyxr-content-contract.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new FileNotFoundException("Unable to locate the checked-in editor content contract.");
    }
}
