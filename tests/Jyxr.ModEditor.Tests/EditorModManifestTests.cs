using JsonEditor.Services;
using Xunit;

namespace Jyxr.ModEditor.Tests;

public sealed class EditorModManifestTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"jyxr-manifest-tests-{Guid.NewGuid():N}");

    public EditorModManifestTests()
    {
        Directory.CreateDirectory(_root);
    }

    [Fact]
    public void Load_AcceptsRuntimeManifestRulesAndJsonc()
    {
        File.WriteAllBytes(Path.Combine(_root, "assets.pck"), [0]);

        var manifest = Load("""
            {
              // Runtime manifests support comments and trailing commas.
              "id": "test.mod-1",
              "name": "Test",
              "version": "1.0.0",
              "date": "2026-07-27",
              "packs": ["assets.pck"],
            }
            """);

        Assert.Equal("test.mod-1", manifest.Id);
        Assert.Equal(["assets.pck"], manifest.Packs);
    }

    [Theory]
    [InlineData("{\"id\":\"test\",\"name\":\"Test\",\"version\":\"1\",\"future\":true}")]
    [InlineData("{\"id\":\"测试\",\"name\":\"Test\",\"version\":\"1\"}")]
    [InlineData("{\"id\":\"test\",\"name\":\"Test\",\"version\":\"1\",\"date\":\"2026/07/27\"}")]
    [InlineData("{\"id\":\"test\",\"name\":\"\",\"version\":\"1\"}")]
    [InlineData("{\"id\":\"test\",\"name\":\"Test\",\"version\":\"1\",\"assemblies\":[\"../outside.dll\"]}")]
    public void Load_RejectsInvalidRuntimeManifest(string json)
    {
        Assert.ThrowsAny<Exception>(() => Load(json));
    }

    [Fact]
    public void Load_RejectsMissingPack()
    {
        Assert.Throws<FileNotFoundException>(() => Load("""
            {"id":"test","name":"Test","version":"1","packs":["missing.pck"]}
            """));
    }

    [Fact]
    public void Load_RejectsPackWithWrongExtension()
    {
        File.WriteAllBytes(Path.Combine(_root, "assets.zip"), [0]);

        Assert.Throws<InvalidOperationException>(() => Load("""
            {"id":"test","name":"Test","version":"1","packs":["assets.zip"]}
            """));
    }

    private EditorModManifest Load(string json)
    {
        var path = Path.Combine(_root, "mod.json");
        File.WriteAllText(path, json);
        return EditorModManifest.Load(path, _root);
    }

    public void Dispose()
    {
        if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
    }
}
