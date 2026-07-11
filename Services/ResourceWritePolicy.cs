namespace JsonEditor.Services;

public enum ResourceWriteAction
{
    Create,
    Reuse,
    Conflict,
}

public sealed record ResourceWriteDecision(
    ResourceWriteAction Action,
    bool CanApply,
    string Message);

public static class ResourceWritePolicy
{
    public static ResourceWriteDecision Decide(
        string resourceId,
        string targetGroup,
        string targetValue,
        string? existingGroup,
        string? existingValue)
    {
        if (existingGroup is null && existingValue is null)
        {
            return new ResourceWriteDecision(
                ResourceWriteAction.Create,
                true,
                $"Create resource {resourceId} in group '{targetGroup}' with value '{targetValue}'.");
        }

        if (string.Equals(existingGroup, targetGroup, StringComparison.Ordinal) &&
            string.Equals(existingValue, targetValue, StringComparison.Ordinal))
        {
            return new ResourceWriteDecision(
                ResourceWriteAction.Reuse,
                true,
                $"Reuse resource {resourceId}.");
        }

        return new ResourceWriteDecision(
            ResourceWriteAction.Conflict,
            false,
            $"Resource conflict: {resourceId} maps to group '{existingGroup}' and value '{existingValue}', expected group '{targetGroup}' and value '{targetValue}'.");
    }
}
