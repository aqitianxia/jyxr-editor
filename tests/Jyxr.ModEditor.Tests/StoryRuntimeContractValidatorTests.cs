using JsonEditor.Services;
using Xunit;

namespace Jyxr.ModEditor.Tests;

public sealed class StoryRuntimeContractValidatorTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"jyxr-story-contract-tests-{Guid.NewGuid():N}");
    private readonly ContentContractCatalog _catalog;

    public StoryRuntimeContractValidatorTests()
    {
        _catalog = ContentContractCatalog.Load(FindContractPath());
        Directory.CreateDirectory(_root);
        foreach (var contentFile in _catalog.Contract.RequiredContentFiles)
        {
            File.WriteAllText(
                Path.Combine(_root, contentFile.Path),
                string.Equals(contentFile.Path, "game-config.json", StringComparison.Ordinal) ? "{}" : "[]");
        }

        Directory.CreateDirectory(Path.Combine(_root, "story"));
    }

    [Fact]
    public void Validate_AcceptsCommandsPredicatesReferencesAndDeclaredVariablesFromTheGameContract()
    {
        File.WriteAllText(Path.Combine(_root, "characters.json"), """
            [{
              "id": "主角",
              "name": "小虾米",
              "equipmentIds": [],
              "externalSkills": [],
              "internalSkills": [],
              "stats": {},
              "talentIds": []
            }]
            """);
        File.WriteAllText(Path.Combine(_root, "resources.json"), """
            [{"id":"地图.测试","group":"地图","value":"map/test"}]
            """);
        File.WriteAllText(Path.Combine(_root, "story", "valid.story.json"), """
            {
              "version": 2,
              "segments": [{
                "name": "测试入口",
                "steps": [
                  {"kind":"command","name":"set_flag","args":["已开启"]},
                  {"kind":"command","name":"random_join","args":[["list","主角"]]},
                  {"kind":"command","name":"background","args":["地图.测试"]},
                  {"kind":"branch","cases":[{
                    "when":["and",["==",["var","last_trial_count"],0],["==",["var","已开启"],true]],
                    "steps":[{"kind":"call","target":"测试入口"}]
                  }],"fallback":null},
                  {"kind":"return"}
                ]
              }]
            }
            """);

        var result = _catalog.Validate(_root);

        Assert.DoesNotContain(result.Issues, issue => issue.Category == "story");
    }

    [Fact]
    public void Validate_RejectsRuntimeFailuresInJsonOnlyStories()
    {
        File.WriteAllText(Path.Combine(_root, "story", "invalid.story.json"), """
            {
              "version": 2,
              "segments": [{
                "name": "错误入口",
                "steps": [
                  {"kind":"command","name":"random_jon","args":[["list","主角"]]},
                  {"kind":"command","name":"join","args":[]},
                  {"kind":"command","name":"cost_money","args":["10"]},
                  {"kind":"command","name":"join","args":["不存在角色"]},
                  {"kind":"branch","cases":[
                    {"when":["pred","typo_predicate"],"steps":[]},
                    {"when":[">",["var","未声明"],0],"steps":[]}
                  ],"fallback":null},
                  {"kind":"future_step"}
                ]
              }]
            }
            """);

        var result = _catalog.Validate(_root);

        foreach (var code in new[]
                 {
                     "story.command.unknown",
                     "story.argument.count",
                     "story.argument.type",
                     "story.reference.missing",
                     "story.predicate.unknown",
                     "story.variable.unknown",
                     "story.step.unknown",
                 })
        {
            Assert.Contains(result.Issues, issue => issue.Code == code);
        }
    }

    private static string FindContractPath()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "src", "Jyxr.ModEditor", "Contracts", "jyxr-content-contract.json");
            if (File.Exists(candidate)) return candidate;
            directory = directory.Parent;
        }

        throw new FileNotFoundException("Unable to locate the checked-in editor content contract.");
    }

    public void Dispose()
    {
        if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
    }
}
