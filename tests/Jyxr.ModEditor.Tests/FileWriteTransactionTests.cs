using System.Text;
using JsonEditor.Services;
using Xunit;

namespace Jyxr.ModEditor.Tests;

public sealed class FileWriteTransactionTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"jyxr-transaction-tests-{Guid.NewGuid():N}");

    public FileWriteTransactionTests()
    {
        Directory.CreateDirectory(_root);
    }

    [Fact]
    public void TryCommit_WhenValidationFails_RestoresEveryExistingFile()
    {
        var sourcePath = Path.Combine(_root, "chapter.story");
        var compiledPath = Path.Combine(_root, "chapter.story.json");
        File.WriteAllText(sourcePath, "old source", Encoding.UTF8);
        File.WriteAllText(compiledPath, "old json", Encoding.UTF8);

        using (var transaction = new FileWriteTransaction())
        {
            transaction.StageText(sourcePath, "new source", Encoding.UTF8);
            transaction.StageText(compiledPath, "new json", Encoding.UTF8);

            Assert.False(transaction.TryCommit(static () => false));
        }

        Assert.Equal("old source", File.ReadAllText(sourcePath, Encoding.UTF8));
        Assert.Equal("old json", File.ReadAllText(compiledPath, Encoding.UTF8));
        AssertNoTransactionArtifacts();
    }

    [Fact]
    public void TryCommit_WhenValidationFails_RemovesNewCompanionFile()
    {
        var sourcePath = Path.Combine(_root, "chapter.story");
        var compiledPath = Path.Combine(_root, "chapter.story.json");
        File.WriteAllText(compiledPath, "old json", Encoding.UTF8);

        using (var transaction = new FileWriteTransaction())
        {
            transaction.StageText(sourcePath, "new source", Encoding.UTF8);
            transaction.StageText(compiledPath, "new json", Encoding.UTF8);

            Assert.False(transaction.TryCommit(static () => false));
        }

        Assert.False(File.Exists(sourcePath));
        Assert.Equal("old json", File.ReadAllText(compiledPath, Encoding.UTF8));
        AssertNoTransactionArtifacts();
    }

    [Fact]
    public void TryCommit_WhenValidationPasses_ReplacesBothFiles()
    {
        var sourcePath = Path.Combine(_root, "chapter.story");
        var compiledPath = Path.Combine(_root, "chapter.story.json");
        File.WriteAllText(sourcePath, "old source", Encoding.UTF8);
        File.WriteAllText(compiledPath, "old json", Encoding.UTF8);

        using (var transaction = new FileWriteTransaction())
        {
            transaction.StageText(sourcePath, "new source", Encoding.UTF8);
            transaction.StageText(compiledPath, "new json", Encoding.UTF8);

            Assert.True(transaction.TryCommit(static () => true));
        }

        Assert.Equal("new source", File.ReadAllText(sourcePath, Encoding.UTF8));
        Assert.Equal("new json", File.ReadAllText(compiledPath, Encoding.UTF8));
        AssertNoTransactionArtifacts();
    }

    private void AssertNoTransactionArtifacts()
    {
        Assert.DoesNotContain(Directory.EnumerateFiles(_root), path =>
            path.EndsWith(".candidate", StringComparison.Ordinal) ||
            path.EndsWith(".rollback", StringComparison.Ordinal));
    }

    public void Dispose()
    {
        if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
    }
}
