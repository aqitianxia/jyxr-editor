using System.Text.Json;
using System.Text.Json.Nodes;

namespace JsonEditor.Services;

public static class EditorJson
{
    private static JsonDocumentOptions DocumentOptions { get; } = new()
    {
        CommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static JsonSerializerOptions SerializerOptions { get; } = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static JsonDocument ParseDocument(string json) =>
        JsonDocument.Parse(json, DocumentOptions);

    public static JsonNode? ParseNode(string json) =>
        JsonNode.Parse(json, documentOptions: DocumentOptions);
}
