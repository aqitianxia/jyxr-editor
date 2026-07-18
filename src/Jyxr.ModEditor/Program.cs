using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using JsonEditor.Services;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
var workspaceRoot = builder.Configuration["workspace"];
var workspaceSession = new WorkspaceSession(workspaceRoot);
var contentContractCatalog = ContentContractCatalog.Load(
    Path.Combine(builder.Environment.ContentRootPath, "Contracts", "jyxr-content-contract.json"));
builder.WebHost.UseWebRoot(Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
if (string.IsNullOrWhiteSpace(builder.Configuration["urls"]))
{
    builder.WebHost.UseUrls("http://localhost:5127");
}

var app = builder.Build();
var contentTypes = new FileExtensionContentTypeProvider();

app.UseDefaultFiles();
app.UseStaticFiles();

app.Use(async (context, next) =>
{
    try
    {
        var isWorkspaceApi = context.Request.Path.StartsWithSegments("/api/workspace");
        if (context.Request.Path.StartsWithSegments("/api") && !isWorkspaceApi && !workspaceSession.IsOpen)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new ErrorResponse("请先打开创作工作区。"));
            return;
        }

        await next();
    }
    catch (InvalidOperationException ex) when (!context.Response.HasStarted)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(new ErrorResponse(ex.Message));
    }
});

app.MapGet("/api/workspace", () => Results.Ok(workspaceSession.Describe()));

app.MapPost("/api/workspace/open", IResult (OpenWorkspaceRequest request) =>
{
    try
    {
        return Results.Ok(workspaceSession.Open(request.Path));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/workspace/pick", async Task<IResult> (HttpContext context) =>
{
    var result = await WorkspaceFolderPicker.PickAsync(context.RequestAborted);
    return Results.Ok(new WorkspacePickResponse(result.Supported, result.Canceled, result.Path, result.Message));
});

app.MapGet("/api/data/files", (string? modId) =>
{
    var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
    if (!Directory.Exists(modWorkspace.DataPath))
    {
        return Results.Ok(Array.Empty<FileEntry>());
    }

    return Results.Ok(ListDataFiles(modWorkspace.DataPath));
});

app.MapGet("/api/data/file", IResult (string path, string? modId) =>
{
    var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
    var filePath = modWorkspace.ResolveDataTextFile(path);
    if (!File.Exists(filePath))
    {
        return Results.NotFound(new ErrorResponse($"Data file was not found: {path}"));
    }

    return Results.Ok(new FileContentResponse(path, File.ReadAllText(filePath, Encoding.UTF8)));
});

app.MapPut("/api/data/file", IResult (SaveFileRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var filePath = modWorkspace.ResolveDataFile(request.Path);
        var formatted = FormatJson(request.Content);
        var backupPath = BackupFile(modWorkspace, filePath);
        ValidationResponse? validation = null;
        using var transaction = new FileWriteTransaction();
        transaction.StageText(filePath, formatted, Encoding.UTF8);
        var committed = transaction.TryCommit(() =>
        {
            validation = ValidateContent(modWorkspace, contentContractCatalog);
            return validation.Ok;
        });
        if (!committed)
        {
            return Results.BadRequest(new ErrorResponse(
                $"Content validation failed; the original file was restored: {validation?.Message}"));
        }

        return Results.Ok(new SaveFileResponse(request.Path, formatted, backupPath, validation!));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPut("/api/story/source", IResult (SaveStorySourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var sourcePath = modWorkspace.ResolveStorySourceFile(request.Path);
        var compiledRelativePath = GetCompiledStoryJsonPath(request.Path);
        var compiledPath = modWorkspace.ResolveDataFile(compiledRelativePath);
        var formattedJson = FormatJson(request.CompiledJson);
        var sourceBackupPath = BackupFile(modWorkspace, sourcePath);
        var jsonBackupPath = BackupFile(modWorkspace, compiledPath);

        Directory.CreateDirectory(Path.GetDirectoryName(sourcePath)!);
        Directory.CreateDirectory(Path.GetDirectoryName(compiledPath)!);
        File.WriteAllText(sourcePath, NormalizeTextFile(request.Content), Encoding.UTF8);
        File.WriteAllText(compiledPath, formattedJson, Encoding.UTF8);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new SaveStorySourceResponse(
            request.Path,
            NormalizeTextFile(request.Content),
            compiledRelativePath,
            formattedJson,
            sourceBackupPath,
            jsonBackupPath,
            validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"Compiled story JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/story/source/from-json", IResult (SaveStoryJsonAsSourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var compiledRelativePath = NormalizeCompiledStoryJsonPath(request.JsonPath);
        var sourceRelativePath = GetStorySourcePathFromCompiledJson(compiledRelativePath);
        var sourcePath = modWorkspace.ResolveStorySourceFile(sourceRelativePath);
        var compiledPath = modWorkspace.ResolveDataFile(compiledRelativePath);
        if (File.Exists(sourcePath))
        {
            return Results.BadRequest(new ErrorResponse($"Story source already exists: {sourceRelativePath}"));
        }

        var formattedJson = FormatJson(request.CompiledJson);
        var jsonBackupPath = BackupFile(modWorkspace, compiledPath);

        Directory.CreateDirectory(Path.GetDirectoryName(sourcePath)!);
        Directory.CreateDirectory(Path.GetDirectoryName(compiledPath)!);
        File.WriteAllText(sourcePath, NormalizeTextFile(request.Content), Encoding.UTF8);
        File.WriteAllText(compiledPath, formattedJson, Encoding.UTF8);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new SaveStorySourceResponse(
            sourceRelativePath,
            NormalizeTextFile(request.Content),
            compiledRelativePath,
            formattedJson,
            null,
            jsonBackupPath,
            validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"Compiled story JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/story/source/new", IResult (CreateStorySourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var relativePath = NormalizeNewStorySourcePath(request.FileName);
        var sourcePath = modWorkspace.ResolveStorySourceFile(relativePath);
        var compiledRelativePath = GetCompiledStoryJsonPath(relativePath);
        var compiledPath = modWorkspace.ResolveDataFile(compiledRelativePath);
        if (File.Exists(sourcePath))
        {
            return Results.BadRequest(new ErrorResponse($"Story source already exists: {relativePath}"));
        }

        if (File.Exists(compiledPath))
        {
            return Results.BadRequest(new ErrorResponse($"Compiled story JSON already exists: {compiledRelativePath}"));
        }

        var segmentName = NormalizeNewStorySegmentName(request.SegmentName, Path.GetFileNameWithoutExtension(relativePath));
        var content = CreateStorySourceTemplate(segmentName);
        Directory.CreateDirectory(Path.GetDirectoryName(sourcePath)!);
        File.WriteAllText(sourcePath, content, Encoding.UTF8);

        return Results.Ok(new CreateStorySourceResponse(relativePath, content, compiledRelativePath));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapGet("/api/contract", () => Results.Ok(contentContractCatalog.Contract));

app.MapGet("/api/validate", (string? modId) =>
    Results.Ok(ValidateContent(workspaceSession.RequireCurrent().ForMod(modId), contentContractCatalog)));

app.MapGet("/api/story/graph", IResult (string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        return Results.Ok(BuildStoryGraph(modWorkspace));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"Story JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/static/speaker", IResult (CreateSpeakerRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var speakerId = NormalizeRequiredId(request.Id, "Speaker id");
        var speakerName = string.IsNullOrWhiteSpace(request.Name) ? speakerId : request.Name.Trim();
        var portraitId = string.IsNullOrWhiteSpace(request.PortraitId)
            ? $"头像.{speakerId}"
            : NormalizePortraitResourceId(request.PortraitId);
        var assetValue = NormalizePortraitAssetValue(request.AssetValue, speakerId);
        var gender = NormalizeGender(request.Gender);
        EnsurePortraitAssetReadable(modWorkspace, assetValue);

        var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
        var charactersPath = modWorkspace.ResolveDataFile("characters.json");
        var backupPaths = new List<string>();

        var resources = ReadJsonArray(resourcesPath, "resources.json");
        var existingResource = resources.OfType<JsonObject>()
            .FirstOrDefault(record => string.Equals(TryGetStringProperty(record, "id"), portraitId, StringComparison.Ordinal));
        if (existingResource is not null)
        {
            var existingGroup = TryGetStringProperty(existingResource, "group") ?? string.Empty;
            var existingValue = TryGetStringProperty(existingResource, "value") ?? string.Empty;
            if (!string.Equals(existingGroup, "头像", StringComparison.Ordinal)
                || !string.Equals(existingValue, assetValue, StringComparison.Ordinal))
            {
                return Results.BadRequest(new ErrorResponse(
                    $"Portrait resource conflict: {portraitId} already maps to group '{existingGroup}' and value '{existingValue}', not '{assetValue}'."));
            }
        }

        var characters = ReadJsonArray(charactersPath, "characters.json");
        if (JsonArrayContainsStringProperty(characters, "id", speakerId))
        {
            return Results.BadRequest(new ErrorResponse(
                $"Speaker already exists: {speakerId}. Edit the existing character instead of creating it again."));
        }

        if (existingResource is null)
        {
            var backup = BackupFile(modWorkspace, resourcesPath);
            if (backup is not null)
            {
                backupPaths.Add(backup);
            }

            resources.Add(new JsonObject
            {
                ["id"] = portraitId,
                ["group"] = "头像",
                ["value"] = assetValue,
            });
            WriteJson(resourcesPath, resources);
        }

        var characterBackup = BackupFile(modWorkspace, charactersPath);
        if (characterBackup is not null)
        {
            backupPaths.Add(characterBackup);
        }

        characters.Add(CreateDialogueSpeakerCharacter(speakerId, speakerName, portraitId, gender));
        WriteJson(charactersPath, characters);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new CreateSpeakerResponse(speakerId, speakerName, portraitId, assetValue, backupPaths, validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/static/portrait-resource", IResult (CreatePortraitResourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var portraitId = NormalizePortraitResourceId(request.PortraitId);
        var assetValue = NormalizePortraitAssetValue(request.AssetValue, portraitId.Replace("头像.", "", StringComparison.Ordinal));
        EnsurePortraitAssetReadable(modWorkspace, assetValue);

        var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
        var resources = ReadJsonArray(resourcesPath, "resources.json");
        if (JsonArrayContainsStringProperty(resources, "id", portraitId))
        {
            return Results.BadRequest(new ErrorResponse($"Portrait resource already exists: {portraitId}"));
        }

        var backupPath = BackupFile(modWorkspace, resourcesPath);
        resources.Add(new JsonObject
        {
            ["id"] = portraitId,
            ["group"] = "头像",
            ["value"] = assetValue,
        });
        WriteJson(resourcesPath, resources);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new CreatePortraitResourceResponse(portraitId, assetValue, backupPath, validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPut("/api/static/portrait-resource", IResult (UpdatePortraitResourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var portraitId = NormalizePortraitResourceId(request.PortraitId);
        var assetValue = NormalizePortraitAssetValue(request.AssetValue, portraitId["头像.".Length..]);
        EnsurePortraitAssetReadable(modWorkspace, assetValue);

        var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
        var resources = ReadJsonArray(resourcesPath, "resources.json");
        var resource = resources.OfType<JsonObject>()
            .FirstOrDefault(record => string.Equals(TryGetStringProperty(record, "id"), portraitId, StringComparison.Ordinal));
        if (resource is null)
        {
            return Results.NotFound(new ErrorResponse($"Portrait resource was not found: {portraitId}"));
        }

        var group = TryGetStringProperty(resource, "group") ?? string.Empty;
        if (!string.Equals(group, "头像", StringComparison.Ordinal))
        {
            return Results.BadRequest(new ErrorResponse($"Resource is not a portrait: {portraitId} belongs to group '{group}'."));
        }

        var currentValue = TryGetStringProperty(resource, "value") ?? string.Empty;
        var expectedValue = request.ExpectedAssetValue?.Trim() ?? string.Empty;
        if (!string.Equals(currentValue, expectedValue, StringComparison.Ordinal))
        {
            return Results.Conflict(new ErrorResponse(
                $"Portrait resource changed before update: {portraitId} now points to '{currentValue}', expected '{expectedValue}'."));
        }

        string? backupPath = null;
        if (!string.Equals(currentValue, assetValue, StringComparison.Ordinal))
        {
            backupPath = BackupFile(modWorkspace, resourcesPath);
            resource["value"] = assetValue;
            WriteJson(resourcesPath, resources);
        }

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new CreatePortraitResourceResponse(portraitId, assetValue, backupPath, validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/static/item-resource", IResult (CreateItemResourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var pictureId = NormalizeRequiredId(request.PictureId, "Picture id");
        var assetValue = NormalizeItemAssetValue(request.AssetValue, pictureId.Replace("物品.", "", StringComparison.Ordinal));

        var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
        var resources = ReadJsonArray(resourcesPath, "resources.json");
        if (JsonArrayContainsStringProperty(resources, "id", pictureId))
        {
            return Results.BadRequest(new ErrorResponse($"Item resource already exists: {pictureId}"));
        }

        var backupPath = BackupFile(modWorkspace, resourcesPath);
        resources.Add(new JsonObject
        {
            ["id"] = pictureId,
            ["group"] = "物品",
            ["value"] = assetValue,
        });
        WriteJson(resourcesPath, resources);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new CreateItemResourceResponse(pictureId, assetValue, backupPath, validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/static/resource", IResult (CreateResourceRequest request, string? modId) =>
{
    try
    {
        var modWorkspace = workspaceSession.RequireCurrent().ForMod(modId);
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var resourceId = NormalizeRequiredId(request.Id, "Resource id");
        var group = NormalizeResourceGroup(request.Group);
        var assetValue = NormalizeResourceAssetValue(request.Value, group);
        if (group == "头像")
        {
            resourceId = NormalizePortraitResourceId(resourceId);
            EnsurePortraitAssetReadable(modWorkspace, assetValue);
        }

        var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
        var resources = ReadJsonArray(resourcesPath, "resources.json");
        if (JsonArrayContainsStringProperty(resources, "id", resourceId))
        {
            return Results.BadRequest(new ErrorResponse($"Resource already exists: {resourceId}"));
        }

        var backupPath = BackupFile(modWorkspace, resourcesPath);
        resources.Add(new JsonObject
        {
            ["id"] = resourceId,
            ["group"] = group,
            ["value"] = assetValue,
        });
        WriteJson(resourcesPath, resources);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new CreateResourceResponse(resourceId, group, assetValue, backupPath, validation));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapGet("/api/static/portraits/check", (string? modId) =>
{
    try
    {
        return Results.Ok(CheckPortraits(workspaceSession.RequireCurrent().ForMod(modId)));
    }
    catch (JsonException ex)
    {
        return Results.BadRequest(new ErrorResponse($"JSON parse failed: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapGet("/api/assets/files", (bool? includeImport) =>
{
    var workspace = workspaceSession.RequireCurrent();
    if (!Directory.Exists(workspace.AssetsPath))
    {
        return Results.Ok(Array.Empty<FileEntry>());
    }

    return Results.Ok(ListFiles(workspace.AssetsPath, "*", includeImport == true));
});

app.MapGet("/api/assets/skill-animations", () =>
    Results.Ok(GodotSkillAnimationCatalog.List(workspaceSession.RequireCurrent().AssetsPath)));

app.MapGet("/api/assets/skill-animation", IResult (string id) =>
{
    try
    {
        var workspace = workspaceSession.RequireCurrent();
        return Results.Ok(GodotSkillAnimationCatalog.Load(id, workspace.AssetsPath));
    }
    catch (FileNotFoundException exception)
    {
        return Results.NotFound(new ErrorResponse(exception.Message));
    }
    catch (Exception exception)
    {
        return Results.BadRequest(new ErrorResponse(exception.Message));
    }
});

app.MapGet("/api/assets/file", IResult (string path) =>
{
    var workspace = workspaceSession.RequireCurrent();
    var filePath = workspace.ResolveAssetFile(path);
    if (!File.Exists(filePath))
    {
        return Results.NotFound(new ErrorResponse($"Asset file was not found: {path}"));
    }

    if (!contentTypes.TryGetContentType(filePath, out var contentType))
    {
        contentType = "application/octet-stream";
    }

    return Results.File(filePath, contentType, enableRangeProcessing: true);
});

app.MapPost("/api/assets/portrait/normalize", IResult (NormalizePortraitRequest request) =>
{
    try
    {
        var workspace = workspaceSession.RequireCurrent();
        var assetPath = request.Path.Trim().Replace('\\', '/');
        var isPortrait = assetPath.StartsWith("art/head/", StringComparison.OrdinalIgnoreCase);
        var isItem = assetPath.StartsWith("art/item/", StringComparison.OrdinalIgnoreCase);
        if ((!isPortrait && !isItem) ||
            !string.Equals(Path.GetExtension(assetPath), ".png", StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new ErrorResponse("Only PNG files under assets/art/head or assets/art/item can be normalized."));
        }

        var filePath = workspace.ResolveAssetFile(assetPath);
        if (!File.Exists(filePath))
        {
            return Results.NotFound(new ErrorResponse($"Asset file was not found: {request.Path}"));
        }

        var pngBytes = Convert.FromBase64String(request.PngBase64);
        if (pngBytes.Length < 8 || pngBytes[0] != 137 || pngBytes[1] != 80 || pngBytes[2] != 78 || pngBytes[3] != 71)
        {
            return Results.BadRequest(new ErrorResponse("Normalized portrait must be PNG data."));
        }

        var backupPath = BackupAssetFile(workspace, filePath);
        File.WriteAllBytes(filePath, pngBytes);
        var info = new FileInfo(filePath);
        return Results.Ok(new NormalizePortraitResponse(assetPath, backupPath, info.Length, info.LastWriteTimeUtc));
    }
    catch (FormatException ex)
    {
        return Results.BadRequest(new ErrorResponse($"PNG data is invalid: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/assets/item/upload-bind", IResult (UploadItemImageRequest request, string? modId) =>
{
    try
    {
        var workspace = workspaceSession.RequireCurrent();
        var modWorkspace = workspace.ForMod(modId);
        if (!Directory.Exists(workspace.AssetsPath))
        {
            return Results.BadRequest(new ErrorResponse($"Assets directory was not found: {workspace.AssetsPath}"));
        }

        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }

        var preflight = BuildItemImageUploadPreflight(workspace, modWorkspace, new ItemImageUploadPreflightRequest(
            request.ItemId,
            request.PictureId,
            request.FileName,
            request.MimeType));
        if (!preflight.CanApply)
        {
            return Results.BadRequest(new ErrorResponse(preflight.Message));
        }
        if (!string.Equals(request.PreflightToken, preflight.Token, StringComparison.Ordinal))
        {
            return Results.Conflict(new ErrorResponse("Item image upload state changed after preflight. Run the upload check again."));
        }
        if (preflight.AssetExists && !request.AllowAssetOverwrite)
        {
            return Results.Conflict(new ErrorResponse($"Asset already exists and overwrite was not confirmed: {preflight.AssetPath}"));
        }

        var itemId = preflight.ItemId;
        var pictureId = preflight.PictureId;
        var extension = NormalizeImageExtension(request.FileName, request.MimeType);
        var imageBytes = Convert.FromBase64String(request.ImageBase64);
        if (imageBytes.Length == 0)
        {
            return Results.BadRequest(new ErrorResponse("Uploaded image is empty."));
        }

        ValidateImageSignature(imageBytes, extension);

        var assetValue = preflight.AssetValue;
        var relativeAssetPath = preflight.AssetPath;
        var assetFilePath = workspace.ResolveAssetFile(relativeAssetPath);
        var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
        var resources = ReadJsonArray(resourcesPath, "resources.json");
        var resourceChanged = string.Equals(preflight.ResourceAction, "create", StringComparison.Ordinal);
        if (resourceChanged)
        {
            resources.Add(new JsonObject
            {
                ["id"] = pictureId,
                ["group"] = "物品",
                ["value"] = assetValue,
            });
        }

        // All validation and conflict checks complete before either target is backed up or written.
        var assetBackupPath = preflight.AssetExists ? BackupAssetFile(workspace, assetFilePath) : null;
        var resourceBackupPath = resourceChanged ? BackupFile(modWorkspace, resourcesPath) : null;
        Directory.CreateDirectory(Path.GetDirectoryName(assetFilePath)!);
        File.WriteAllBytes(assetFilePath, imageBytes);
        if (resourceChanged) WriteJson(resourcesPath, resources);

        var validation = ValidateContent(modWorkspace, contentContractCatalog);
        return Results.Ok(new UploadItemImageResponse(
            itemId,
            pictureId,
            assetValue,
            relativeAssetPath,
            resourceChanged,
            resourceBackupPath,
            assetBackupPath,
            validation));
    }
    catch (FormatException ex)
    {
        return Results.BadRequest(new ErrorResponse($"Image data is invalid: {ex.Message}"));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.MapPost("/api/assets/item/upload-bind/preflight", IResult (ItemImageUploadPreflightRequest request, string? modId) =>
{
    try
    {
        var workspace = workspaceSession.RequireCurrent();
        var modWorkspace = workspace.ForMod(modId);
        if (!Directory.Exists(workspace.AssetsPath))
        {
            return Results.BadRequest(new ErrorResponse($"Assets directory was not found: {workspace.AssetsPath}"));
        }
        if (!Directory.Exists(modWorkspace.DataPath))
        {
            return Results.BadRequest(new ErrorResponse($"Data directory was not found: {modWorkspace.DataPath}"));
        }
        return Results.Ok(BuildItemImageUploadPreflight(workspace, modWorkspace, request));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new ErrorResponse(ex.Message));
    }
});

app.Run();

static ItemImageUploadPreflightResponse BuildItemImageUploadPreflight(
    WorkspacePaths workspace,
    WorkspacePaths modWorkspace,
    ItemImageUploadPreflightRequest request)
{
    var itemId = NormalizeRequiredId(request.ItemId, "Item id");
    var pictureId = NormalizeRequiredId(
        string.IsNullOrWhiteSpace(request.PictureId) ? $"物品.{itemId}" : request.PictureId,
        "Picture id");
    var extension = NormalizeImageExtension(request.FileName, request.MimeType);
    var assetValue = NormalizeItemAssetValue(null, pictureId.Replace("物品.", "", StringComparison.Ordinal));
    var assetPath = $"art/{assetValue}{extension}";
    var assetFilePath = workspace.ResolveAssetFile(assetPath);
    var assetInfo = new FileInfo(assetFilePath);
    var resourcesPath = modWorkspace.ResolveDataFile("resources.json");
    var resources = ReadJsonArray(resourcesPath, "resources.json");
    var matchingResources = resources.OfType<JsonObject>()
        .Where(record => string.Equals(TryGetStringProperty(record, "id"), pictureId, StringComparison.Ordinal))
        .ToArray();
    var resource = matchingResources.FirstOrDefault();
    var existingGroup = resource is null ? null : TryGetStringProperty(resource, "group") ?? string.Empty;
    var existingValue = resource is null ? null : TryGetStringProperty(resource, "value") ?? string.Empty;
    var decision = matchingResources.Length > 1
        ? new ResourceWriteDecision(
            ResourceWriteAction.Conflict,
            false,
            $"Resource conflict: {pictureId} has {matchingResources.Length} duplicate definitions. Resolve duplicates before uploading.")
        : ResourceWritePolicy.Decide(pictureId, "物品", assetValue, existingGroup, existingValue);
    var action = decision.Action.ToString().ToLowerInvariant();
    var message = decision.CanApply
        ? $"{decision.Message} Write asset {assetPath}."
        : decision.Message;
    var tokenSource = string.Join('\0', new[]
    {
        pictureId,
        existingGroup ?? "<missing>",
        existingValue ?? "<missing>",
        assetInfo.Exists.ToString(),
        assetInfo.Exists ? assetInfo.Length.ToString() : "0",
        assetInfo.Exists ? assetInfo.LastWriteTimeUtc.Ticks.ToString() : "0",
    });
    var token = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(tokenSource)));
    return new ItemImageUploadPreflightResponse(
        decision.CanApply,
        message,
        token,
        itemId,
        pictureId,
        assetValue,
        assetPath,
        action,
        existingGroup,
        existingValue,
        assetInfo.Exists,
        assetInfo.Exists ? assetInfo.LastWriteTimeUtc : null);
}

static IReadOnlyList<FileEntry> ListFiles(string rootPath, string pattern, bool includeImportFiles)
{
    return Directory.EnumerateFiles(rootPath, pattern, SearchOption.AllDirectories)
        .Where(path => includeImportFiles || !path.EndsWith(".import", StringComparison.OrdinalIgnoreCase))
        .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
        .Select(path =>
        {
            var info = new FileInfo(path);
            return new FileEntry(
                ToRelativePath(rootPath, path),
                info.Name,
                info.Extension,
                info.Length,
                info.LastWriteTimeUtc);
        })
        .ToArray();
}

static IReadOnlyList<FileEntry> ListDataFiles(string rootPath)
{
    return Directory.EnumerateFiles(rootPath, "*", SearchOption.AllDirectories)
        .Where(path =>
            path.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".story", StringComparison.OrdinalIgnoreCase))
        .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
        .Select(path =>
        {
            var info = new FileInfo(path);
            return new FileEntry(
                ToRelativePath(rootPath, path),
                info.Name,
                info.Extension,
                info.Length,
                info.LastWriteTimeUtc);
        })
        .ToArray();
}

static string FormatJson(string json)
{
    using var document = JsonDocument.Parse(json);
    using var stream = new MemoryStream();
    using (var writer = new Utf8JsonWriter(stream, new JsonWriterOptions
    {
        Indented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    }))
    {
        document.WriteTo(writer);
    }

    return Encoding.UTF8.GetString(stream.ToArray()) + Environment.NewLine;
}

static string NormalizeTextFile(string text) =>
    text.EndsWith('\n') ? text : text + Environment.NewLine;

static string NormalizeNewStorySourcePath(string? fileName)
{
    if (string.IsNullOrWhiteSpace(fileName))
    {
        throw new InvalidOperationException("Story file name is required.");
    }

    var normalized = fileName.Trim().Replace('\\', '/');
    if (Path.IsPathRooted(normalized) || normalized.Contains("..", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Story file name must stay under data/story.");
    }

    if (normalized.StartsWith("data/", StringComparison.OrdinalIgnoreCase))
    {
        normalized = normalized["data/".Length..];
    }

    if (normalized.StartsWith("story/", StringComparison.OrdinalIgnoreCase))
    {
        normalized = normalized["story/".Length..];
    }

    normalized = normalized.Trim('/');
    if (string.IsNullOrWhiteSpace(normalized))
    {
        throw new InvalidOperationException("Story file name is required.");
    }

    if (normalized.EndsWith(".story.json", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Create the .story source file, not the generated .story.json file.");
    }

    if (!normalized.EndsWith(".story", StringComparison.OrdinalIgnoreCase))
    {
        normalized += ".story";
    }

    var invalidChars = Path.GetInvalidFileNameChars();
    var parts = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
    if (parts.Length == 0 || parts.Any(part => part.Length == 0 || part.IndexOfAny(invalidChars) >= 0))
    {
        throw new InvalidOperationException("Story file name contains invalid path characters.");
    }

    return $"story/{string.Join('/', parts)}";
}

static string NormalizeNewStorySegmentName(string? segmentName, string fallback)
{
    var normalized = string.IsNullOrWhiteSpace(segmentName) ? fallback : segmentName.Trim();
    normalized = normalized.EndsWith(".story", StringComparison.OrdinalIgnoreCase)
        ? normalized[..^".story".Length]
        : normalized;
    return string.IsNullOrWhiteSpace(normalized) ? "新剧情入口" : normalized;
}

static string CreateStorySourceTemplate(string segmentName) =>
    NormalizeTextFile($"""
    # {segmentName}
    旁白：新的剧情开始。
    """);

static string GetCompiledStoryJsonPath(string storySourceRelativePath)
{
    if (!storySourceRelativePath.EndsWith(".story", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Story source path must end with .story.");
    }

    return storySourceRelativePath + ".json";
}

static string NormalizeCompiledStoryJsonPath(string? fileName)
{
    if (string.IsNullOrWhiteSpace(fileName))
    {
        throw new InvalidOperationException("Story JSON path is required.");
    }

    var normalized = fileName.Trim().Replace('\\', '/');
    if (Path.IsPathRooted(normalized) || normalized.Contains("..", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Story JSON path must stay under data/story.");
    }

    if (normalized.StartsWith("data/", StringComparison.OrdinalIgnoreCase))
    {
        normalized = normalized["data/".Length..];
    }

    normalized = normalized.Trim('/');
    if (!normalized.StartsWith("story/", StringComparison.OrdinalIgnoreCase) ||
        !normalized.EndsWith(".story.json", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Story JSON path must be a .story.json file under data/story.");
    }

    return normalized;
}

static string GetStorySourcePathFromCompiledJson(string compiledStoryJsonRelativePath)
{
    if (!compiledStoryJsonRelativePath.EndsWith(".story.json", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Compiled story JSON path must end with .story.json.");
    }

    return compiledStoryJsonRelativePath[..^".json".Length];
}

static string? BackupFile(WorkspacePaths workspace, string filePath)
{
    if (!File.Exists(filePath))
    {
        return null;
    }

    var relativePath = ToRelativePath(workspace.DataPath, filePath);
    var backupPath = Path.Combine(
        workspace.BackupPath,
        "data",
        DateTime.UtcNow.ToString("yyyyMMdd-HHmmssfff"),
        relativePath.Replace('/', Path.DirectorySeparatorChar));
    Directory.CreateDirectory(Path.GetDirectoryName(backupPath)!);
    File.Copy(filePath, backupPath, overwrite: false);
    return ToRelativePath(workspace.RootPath, backupPath);
}

static string? BackupAssetFile(WorkspacePaths workspace, string filePath)
{
    if (!File.Exists(filePath))
    {
        return null;
    }

    var relativePath = ToRelativePath(workspace.AssetsPath, filePath);
    var backupPath = Path.Combine(
        workspace.BackupPath,
        "assets",
        DateTime.UtcNow.ToString("yyyyMMdd-HHmmss"),
        relativePath.Replace('/', Path.DirectorySeparatorChar));
    Directory.CreateDirectory(Path.GetDirectoryName(backupPath)!);
    File.Copy(filePath, backupPath, overwrite: false);
    return ToRelativePath(workspace.RootPath, backupPath);
}

static ValidationResponse ValidateContent(WorkspacePaths workspace, ContentContractCatalog contentContractCatalog)
{
    if (!Directory.Exists(workspace.DataPath))
    {
        var issue = new ValidationIssue(
            "contract.data-directory",
            "error",
            "contract",
            $"MOD 数据目录不存在：{workspace.DataPath}",
            null,
            null,
            null);
        return new ValidationResponse(
            false,
            issue.Message,
            new ValidationSummary(0, contentContractCatalog.Contract.ContractVersion, 1, 0, 0),
            [issue]);
    }

    try
    {
        var contractValidation = contentContractCatalog.Validate(workspace.DataPath);
        var issues = contractValidation.Issues
            .Select(static issue => new ValidationIssue(
                issue.Code,
                issue.Severity,
                issue.Category,
                issue.Message,
                issue.Path,
                issue.Line,
                issue.DefinitionId))
            .ToList();
        if (Directory.Exists(workspace.AssetsPath))
        {
            foreach (var animation in GodotSkillAnimationCatalog.List(workspace.AssetsPath)
                         .Where(static animation => animation.Status is "invalid" or "unsupported"))
            {
                issues.Add(new ValidationIssue(
                    $"resource.skill-animation.{animation.Id}",
                    animation.Status == "invalid" ? "warning" : "suggestion",
                    "resource",
                    $"技能动画“{animation.Id}”无法在编辑器预览：{animation.Message}",
                    animation.Path,
                    null,
                    animation.Id));
            }
        }

        var errorCount = issues.Count(static issue => issue.Severity == "error");
        var warningCount = issues.Count(static issue => issue.Severity == "warning");
        var suggestionCount = issues.Count(static issue => issue.Severity == "suggestion");
        var summary = new ValidationSummary(
            contractValidation.JsonFileCount,
            contractValidation.ContractVersion,
            errorCount,
            warningCount,
            suggestionCount);
        var message = errorCount == 0
            ? $"{contractValidation.JsonFileCount} 个 JSON 已通过游戏契约 v{contractValidation.ContractVersion} 检查"
              + (warningCount + suggestionCount == 0 ? "。" : $"，另有 {warningCount} 个警告、{suggestionCount} 个提示。")
            : $"游戏契约检查发现 {errorCount} 个错误、{warningCount} 个警告。";
        return new ValidationResponse(errorCount == 0, message, summary, issues);
    }
    catch (Exception ex)
    {
        var issue = new ValidationIssue(
            "validation.internal",
            "error",
            "contract",
            $"内容检查无法完成：{ex.Message}",
            null,
            null,
            null);
        return new ValidationResponse(
            false,
            issue.Message,
            new ValidationSummary(0, contentContractCatalog.Contract.ContractVersion, 1, 0, 0),
            [issue]);
    }
}

static JsonArray ReadJsonArray(string path, string displayName)
{
    var root = JsonNode.Parse(File.ReadAllText(path, Encoding.UTF8));
    if (root is not JsonArray array)
    {
        throw new InvalidOperationException($"{displayName} must be a top-level JSON array.");
    }

    return array;
}

static void WriteJson(string path, JsonNode node)
{
    var json = node.ToJsonString(new JsonSerializerOptions
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    }) + Environment.NewLine;
    File.WriteAllText(path, json, Encoding.UTF8);
}

static bool JsonArrayContainsStringProperty(JsonArray array, string propertyName, string value) =>
    array.OfType<JsonObject>().Any(record =>
        record.TryGetPropertyValue(propertyName, out var node) &&
        string.Equals(node?.GetValue<string>(), value, StringComparison.Ordinal));

static string NormalizeRequiredId(string value, string fieldName)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"{fieldName} is required.");
    }

    var trimmed = value.Trim();
    if (trimmed.Contains('/') || trimmed.Contains('\\'))
    {
        throw new InvalidOperationException($"{fieldName} must not contain path separators.");
    }

    return trimmed;
}

static string NormalizePortraitResourceId(string value)
{
    var resourceId = NormalizeRequiredId(value, "Portrait resource id");
    if (!resourceId.StartsWith("头像.", StringComparison.Ordinal) || resourceId.Length <= "头像.".Length)
    {
        throw new InvalidOperationException("Portrait resource id must use the format '头像.中文名'.");
    }

    return resourceId;
}

static string NormalizePortraitAssetValue(string? value, string speakerId)
{
    return NormalizeArtAssetValue(value, $"head/{speakerId}", "Portrait asset value is invalid.");
}

static void EnsurePortraitAssetReadable(WorkspacePaths workspace, string assetValue)
{
    var resolution = ResolveArtAsset(workspace, assetValue);
    if (resolution.ExistingRelativePath is null)
    {
        throw new InvalidOperationException($"Portrait image was not found: {resolution.PreferredRelativePath}");
    }

    var fullPath = Path.Combine(
        workspace.AssetsPath,
        resolution.ExistingRelativePath.Replace('/', Path.DirectorySeparatorChar));
    if (TryReadImageMetadata(fullPath) is null)
    {
        throw new InvalidOperationException($"Portrait image dimensions could not be read: {resolution.ExistingRelativePath}");
    }
}

static string NormalizeItemAssetValue(string? value, string itemId)
{
    return NormalizeArtAssetValue(value, $"item/{itemId}", "Item asset value is invalid.");
}

static string NormalizeResourceGroup(string value)
{
    var group = NormalizeRequiredId(value, "Resource group");
    return group switch
    {
        "场景" or "地图" or "音乐" or "音效" or "物品" or "头像" => group,
        _ => throw new InvalidOperationException($"Unsupported resource group: {group}"),
    };
}

static string NormalizeResourceAssetValue(string? value, string group)
{
    var normalized = string.IsNullOrWhiteSpace(value)
        ? throw new InvalidOperationException("Resource value is required.")
        : value.Trim().Replace('\\', '/');

    if (group is "音乐" or "音效")
    {
        foreach (var prefix in new[] { "res://assets/", "assets/" })
        {
            if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized[prefix.Length..];
                break;
            }
        }

        var extension = Path.GetExtension(normalized).ToLowerInvariant();
        if (extension is not (".ogg" or ".mp3" or ".wav" or ".flac"))
        {
            throw new InvalidOperationException("Audio resource value must point to OGG/MP3/WAV/FLAC.");
        }
    }
    else
    {
        foreach (var prefix in new[] { "res://assets/art/", "assets/art/", "art/" })
        {
            if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized[prefix.Length..];
                break;
            }
        }

        var extension = Path.GetExtension(normalized).ToLowerInvariant();
        if (extension is not (".png" or ".jpg" or ".jpeg" or ".webp" or ".bmp" or ".gif"))
        {
            throw new InvalidOperationException("Image resource value must point to PNG/JPG/WEBP/BMP/GIF.");
        }

        normalized = normalized[..^extension.Length];
    }

    if (string.IsNullOrWhiteSpace(normalized) || normalized.Contains("..", StringComparison.Ordinal))
    {
        throw new InvalidOperationException("Resource value is invalid.");
    }

    return normalized;
}

static string NormalizeArtAssetValue(string? value, string defaultValue, string errorMessage)
{
    var normalized = string.IsNullOrWhiteSpace(value)
        ? defaultValue
        : value.Trim().Replace('\\', '/');

    foreach (var prefix in new[] { "res://assets/art/", "assets/art/", "art/" })
    {
        if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized[prefix.Length..];
            break;
        }
    }

    var extension = Path.GetExtension(normalized);
    if (extension is ".png" or ".jpg" or ".jpeg" or ".webp")
    {
        normalized = normalized[..^extension.Length];
    }

    if (string.IsNullOrWhiteSpace(normalized) || normalized.Contains("..", StringComparison.Ordinal))
    {
        throw new InvalidOperationException(errorMessage);
    }

    return normalized;
}

static string NormalizeImageExtension(string? fileName, string? mimeType)
{
    var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
    if (extension is ".png" or ".jpg" or ".jpeg" or ".webp")
    {
        return extension;
    }

    return (mimeType ?? string.Empty).ToLowerInvariant() switch
    {
        "image/png" => ".png",
        "image/jpeg" => ".jpg",
        "image/webp" => ".webp",
        _ => throw new InvalidOperationException("Only PNG/JPG/WEBP images are supported."),
    };
}

static void ValidateImageSignature(byte[] bytes, string extension)
{
    if (extension == ".png")
    {
        if (bytes.Length < 8 || bytes[0] != 137 || bytes[1] != 80 || bytes[2] != 78 || bytes[3] != 71)
        {
            throw new InvalidOperationException("Uploaded file is not a valid PNG image.");
        }

        return;
    }

    if (extension is ".jpg" or ".jpeg")
    {
        if (bytes.Length < 3 || bytes[0] != 0xFF || bytes[1] != 0xD8 || bytes[^2] != 0xFF || bytes[^1] != 0xD9)
        {
            throw new InvalidOperationException("Uploaded file is not a valid JPG image.");
        }

        return;
    }

    if (extension == ".webp")
    {
        if (bytes.Length < 12 ||
            Encoding.ASCII.GetString(bytes, 0, 4) != "RIFF" ||
            Encoding.ASCII.GetString(bytes, 8, 4) != "WEBP")
        {
            throw new InvalidOperationException("Uploaded file is not a valid WEBP image.");
        }

        return;
    }

    throw new InvalidOperationException("Only PNG/JPG/WEBP images are supported.");
}

static string NormalizeGender(string? gender)
{
    var normalized = gender?.Trim().ToLowerInvariant();
    return normalized is "male" or "female" or "neutral" ? normalized : "neutral";
}

static JsonObject CreateDialogueSpeakerCharacter(string id, string name, string portrait, string gender) =>
    new()
    {
        ["id"] = id,
        ["name"] = name,
        ["level"] = 1,
        ["portrait"] = portrait,
        ["gender"] = gender,
        ["arenaEnabled"] = false,
        ["talentIds"] = new JsonArray(),
        ["stats"] = new JsonObject
        {
            ["bili"] = 10,
            ["dingli"] = 10,
            ["fuyuan"] = 10,
            ["gengu"] = 10,
            ["jianfa"] = 10,
            ["daofa"] = 10,
            ["quanzhang"] = 10,
            ["qimen"] = 10,
            ["shenfa"] = 10,
            ["wuxing"] = 10,
            ["wuxue"] = 10,
            ["max_hp"] = 100,
            ["max_mp"] = 100,
        },
        ["specialSkillIds"] = new JsonArray(),
        ["internalSkills"] = new JsonArray(),
        ["equipmentIds"] = new JsonArray(),
        ["externalSkills"] = new JsonArray(),
    };

static PortraitCheckResponse CheckPortraits(WorkspacePaths workspace)
{
    var issues = new List<PortraitCheckIssue>();
    var usedPortraitIds = new HashSet<string>(StringComparer.Ordinal);
    var checkedPortraitIds = new HashSet<string>(StringComparer.Ordinal);

    var charactersPath = workspace.ResolveDataFile("characters.json");
    var resourcesPath = workspace.ResolveDataFile("resources.json");
    if (!File.Exists(charactersPath))
    {
        issues.Add(CreatePortraitIssue("error", "characters", "缺少 characters.json，无法检查角色头像。", "characters.json"));
    }

    if (!File.Exists(resourcesPath))
    {
        issues.Add(CreatePortraitIssue("error", "resources", "缺少 resources.json，无法检查头像资源。", "resources.json"));
    }

    if (!File.Exists(charactersPath) || !File.Exists(resourcesPath))
    {
        return CreatePortraitCheckResponse(0, 0, 0, 0, issues);
    }

    var charactersContent = File.ReadAllText(charactersPath, Encoding.UTF8);
    var resourcesContent = File.ReadAllText(resourcesPath, Encoding.UTF8);
    var characters = ReadJsonArray(charactersPath, "characters.json").OfType<JsonObject>().ToArray();
    var resources = ReadJsonArray(resourcesPath, "resources.json").OfType<JsonObject>().ToArray();
    var resourcesById = resources
        .Select(resource => new
        {
            Resource = resource,
            Id = TryGetStringProperty(resource, "id"),
        })
        .Where(entry => !string.IsNullOrWhiteSpace(entry.Id))
        .GroupBy(entry => entry.Id!, StringComparer.Ordinal)
        .ToDictionary(group => group.Key, group => group.First().Resource, StringComparer.Ordinal);

    var portraitResources = resources
        .Where(resource => string.Equals(TryGetStringProperty(resource, "group"), "头像", StringComparison.Ordinal))
        .ToArray();

    var charactersByIdOrName = new Dictionary<string, JsonObject>(StringComparer.Ordinal);
    foreach (var character in characters)
    {
        var id = TryGetStringProperty(character, "id");
        var name = TryGetStringProperty(character, "name");
        if (!string.IsNullOrWhiteSpace(id))
        {
            charactersByIdOrName[id] = character;
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            charactersByIdOrName[name] = character;
        }

        var portraitId = TryGetStringProperty(character, "portrait");
        if (string.IsNullOrWhiteSpace(portraitId))
        {
            continue;
        }

        usedPortraitIds.Add(portraitId);
        CheckPortraitResource(
            workspace,
            issues,
            checkedPortraitIds,
            resourcesById,
            portraitId,
            id ?? name ?? "未知角色",
            "characters.json",
            FindJsonPropertyLine(charactersContent, "portrait", portraitId));
    }

    var storySpeakerCount = 0;
    var seenStorySpeakerIssues = new HashSet<string>(StringComparer.Ordinal);
    var storyFiles = Directory.Exists(Path.Combine(workspace.DataPath, "story"))
        ? Directory.EnumerateFiles(Path.Combine(workspace.DataPath, "story"), "*.story.json", SearchOption.AllDirectories)
        : Array.Empty<string>();

    foreach (var storyPath in storyFiles.OrderBy(path => path, StringComparer.OrdinalIgnoreCase))
    {
        var relativeStoryPath = ToRelativePath(workspace.DataPath, storyPath);
        var storyContent = File.ReadAllText(storyPath, Encoding.UTF8);
        var storyRoot = JsonNode.Parse(storyContent);
        foreach (var speaker in ExtractStorySpeakers(relativeStoryPath, storyContent, storyRoot))
        {
            if (IsKnownNarratorSpeaker(speaker.Name))
            {
                continue;
            }

            storySpeakerCount += 1;
            if (!charactersByIdOrName.TryGetValue(speaker.Name, out var character))
            {
                var key = $"missing-character|{relativeStoryPath}|{speaker.Name}";
                if (seenStorySpeakerIssues.Add(key))
                {
                    issues.Add(CreatePortraitIssue(
                        "warn",
                        "story",
                        $"剧情说话人「{speaker.Name}」没有匹配的角色定义，运行时通常无法显示专属头像。",
                        relativeStoryPath,
                        speaker.Line,
                        speaker.Name));
                }

                continue;
            }

            var portraitId = TryGetStringProperty(character, "portrait");
            if (string.IsNullOrWhiteSpace(portraitId))
            {
                var key = $"missing-portrait|{relativeStoryPath}|{speaker.Name}";
                if (seenStorySpeakerIssues.Add(key))
                {
                    issues.Add(CreatePortraitIssue(
                        "warn",
                        "story",
                        $"剧情说话人「{speaker.Name}」已匹配角色，但角色没有 portrait 字段。",
                        relativeStoryPath,
                        speaker.Line,
                        speaker.Name));
                }

                continue;
            }

            usedPortraitIds.Add(portraitId);
            CheckPortraitResource(
                workspace,
                issues,
                checkedPortraitIds,
                resourcesById,
                portraitId,
                speaker.Name,
                relativeStoryPath,
                speaker.Line);
        }
    }

    foreach (var resource in portraitResources)
    {
        var portraitId = TryGetStringProperty(resource, "id");
        if (string.IsNullOrWhiteSpace(portraitId) || usedPortraitIds.Contains(portraitId))
        {
            continue;
        }

        issues.Add(CreatePortraitIssue(
            "info",
            "resources",
            $"头像资源「{portraitId}」暂未被 characters.json 的 portrait 字段引用。",
            "resources.json",
            FindJsonPropertyLine(resourcesContent, "id", portraitId),
            portraitId));
    }

    return CreatePortraitCheckResponse(characters.Length, portraitResources.Length, storySpeakerCount, checkedPortraitIds.Count, issues);
}

static void CheckPortraitResource(
    WorkspacePaths workspace,
    List<PortraitCheckIssue> issues,
    HashSet<string> checkedPortraitIds,
    IReadOnlyDictionary<string, JsonObject> resourcesById,
    string portraitId,
    string owner,
    string dataPath,
    int line)
{
    if (!resourcesById.TryGetValue(portraitId, out var resource))
    {
        issues.Add(CreatePortraitIssue(
            "error",
            "resources",
            $"「{owner}」引用的头像资源「{portraitId}」不存在。",
            dataPath,
            line,
            portraitId));
        return;
    }

    var group = TryGetStringProperty(resource, "group");
    if (!string.Equals(group, "头像", StringComparison.Ordinal))
    {
        issues.Add(CreatePortraitIssue(
            "warn",
            "resources",
            $"头像资源「{portraitId}」存在，但 group 不是「头像」。",
            "resources.json",
            null,
            portraitId));
    }

    if (!checkedPortraitIds.Add(portraitId))
    {
        return;
    }

    var assetValue = TryGetStringProperty(resource, "value");
    if (string.IsNullOrWhiteSpace(assetValue))
    {
        issues.Add(CreatePortraitIssue(
            "error",
            "resources",
            $"头像资源「{portraitId}」缺少 value，无法定位图片。",
            "resources.json",
            null,
            portraitId));
        return;
    }

    var assetResolution = ResolveArtAsset(workspace, assetValue);
    if (assetResolution.ExistingRelativePath is null)
    {
        issues.Add(CreatePortraitIssue(
            "error",
            "assets",
            $"头像资源「{portraitId}」指向的图片不存在：{assetValue}",
            "resources.json",
            null,
            portraitId,
            assetResolution.PreferredRelativePath));
        return;
    }

    var metadata = TryReadImageMetadata(Path.Combine(workspace.AssetsPath, assetResolution.ExistingRelativePath.Replace('/', Path.DirectorySeparatorChar)));
    if (metadata is null)
    {
        issues.Add(CreatePortraitIssue(
            "warn",
            "assets",
            $"头像资源「{portraitId}」的图片格式暂不能读取尺寸信息：{assetResolution.ExistingRelativePath}",
            "resources.json",
            null,
            portraitId,
            assetResolution.ExistingRelativePath,
            assetExists: true));
        return;
    }

    if (metadata.Width != 512 || metadata.Height != 512)
    {
        issues.Add(CreatePortraitIssue(
            "warn",
            "assets",
            $"头像资源「{portraitId}」图片尺寸为 {metadata.Width}x{metadata.Height}，建议统一为 512x512。",
            "resources.json",
            null,
            portraitId,
            assetResolution.ExistingRelativePath,
            assetExists: true));
    }

    if (metadata.HasAlpha == false)
    {
        issues.Add(CreatePortraitIssue(
            "warn",
            "assets",
            $"头像资源「{portraitId}」图片没有透明通道，可能在对白框中显示白底。",
            "resources.json",
            null,
            portraitId,
            assetResolution.ExistingRelativePath,
            assetExists: true));
    }
}

static PortraitCheckResponse CreatePortraitCheckResponse(
    int characterCount,
    int portraitResourceCount,
    int storySpeakerCount,
    int checkedPortraitCount,
    IReadOnlyList<PortraitCheckIssue> issues)
{
    var summary = new PortraitCheckSummary(
        characterCount,
        portraitResourceCount,
        storySpeakerCount,
        checkedPortraitCount,
        issues.Count(issue => issue.Severity == "error"),
        issues.Count(issue => issue.Severity == "warn"),
        issues.Count(issue => issue.Severity == "info"));

    return new PortraitCheckResponse(summary.Errors == 0, summary, issues);
}

static PortraitCheckIssue CreatePortraitIssue(
    string severity,
    string area,
    string message,
    string? dataPath = null,
    int? line = null,
    string? definitionId = null,
    string? assetPath = null,
    bool assetExists = false) =>
    new(severity, area, message, dataPath, line, definitionId, assetPath, assetExists);

static string? TryGetStringProperty(JsonObject obj, string propertyName)
{
    return obj.TryGetPropertyValue(propertyName, out var node) && node is JsonValue value && value.TryGetValue<string>(out var text)
        ? text
        : null;
}

static IEnumerable<StorySpeakerReference> ExtractStorySpeakers(string path, string content, JsonNode? root)
{
    var speakers = new List<StorySpeakerReference>();

    void Visit(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            var speaker = TryGetStringProperty(obj, "speaker");
            if (!string.IsNullOrWhiteSpace(speaker) && obj.ContainsKey("text"))
            {
                speakers.Add(new StorySpeakerReference(speaker, path, FindJsonPropertyLine(content, "speaker", speaker)));
            }

            foreach (var child in obj)
            {
                Visit(child.Value);
            }
        }
        else if (node is JsonArray array)
        {
            foreach (var child in array)
            {
                Visit(child);
            }
        }
    }

    Visit(root);
    return speakers;
}

static bool IsKnownNarratorSpeaker(string speaker)
{
    var normalized = speaker.Trim();
    return normalized is "" or "旁白" or "系统" or "提示" or "江湖传闻" or "narrator" or "Narrator";
}

static AssetResolution ResolveArtAsset(WorkspacePaths workspace, string value)
{
    var normalized = value.Trim().Replace('\\', '/');
    foreach (var prefix in new[] { "res://assets/", "assets/" })
    {
        if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized[prefix.Length..];
            break;
        }
    }

    var hasExtension = Path.HasExtension(normalized);
    var candidates = new List<string>();
    foreach (var root in new[] { "", "art/" })
    {
        var basePath = normalized.StartsWith(root, StringComparison.OrdinalIgnoreCase) ? normalized : $"{root}{normalized}";
        if (hasExtension)
        {
            candidates.Add(basePath);
        }
        else
        {
            candidates.Add($"{basePath}.png");
            candidates.Add($"{basePath}.jpg");
            candidates.Add($"{basePath}.jpeg");
            candidates.Add($"{basePath}.webp");
        }
    }

    foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
    {
        var fullPath = Path.Combine(workspace.AssetsPath, candidate.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath))
        {
            return new AssetResolution(candidate, candidate);
        }
    }

    return new AssetResolution(null, candidates.FirstOrDefault() ?? normalized);
}

static ImageMetadata? TryReadImageMetadata(string path)
{
    var extension = Path.GetExtension(path).ToLowerInvariant();
    return extension switch
    {
        ".png" => TryReadPngMetadata(path),
        ".jpg" or ".jpeg" => TryReadJpegMetadata(path),
        _ => null,
    };
}

static ImageMetadata? TryReadPngMetadata(string path)
{
    var bytes = File.ReadAllBytes(path);
    var pngSignature = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 };
    if (bytes.Length < 33 || !pngSignature.SequenceEqual(bytes[..8]))
    {
        return null;
    }

    var width = BinaryPrimitives.ReadInt32BigEndian(bytes.AsSpan(16, 4));
    var height = BinaryPrimitives.ReadInt32BigEndian(bytes.AsSpan(20, 4));
    var colorType = bytes[25];
    var hasAlpha = colorType is 4 or 6 || PngHasTransparencyChunk(bytes);
    return new ImageMetadata(width, height, hasAlpha);
}

static bool PngHasTransparencyChunk(byte[] bytes)
{
    var offset = 8;
    while (offset + 12 <= bytes.Length)
    {
        var length = BinaryPrimitives.ReadInt32BigEndian(bytes.AsSpan(offset, 4));
        if (length < 0 || offset + 12 + length > bytes.Length)
        {
            return false;
        }

        var type = Encoding.ASCII.GetString(bytes, offset + 4, 4);
        if (type == "tRNS")
        {
            return true;
        }

        offset += 12 + length;
    }

    return false;
}

static ImageMetadata? TryReadJpegMetadata(string path)
{
    var bytes = File.ReadAllBytes(path);
    if (bytes.Length < 4 || bytes[0] != 0xFF || bytes[1] != 0xD8)
    {
        return null;
    }

    var offset = 2;
    while (offset + 9 < bytes.Length)
    {
        if (bytes[offset] != 0xFF)
        {
            offset += 1;
            continue;
        }

        var marker = bytes[offset + 1];
        offset += 2;
        if (marker is 0xD8 or 0xD9)
        {
            continue;
        }

        if (offset + 2 > bytes.Length)
        {
            return null;
        }

        var length = BinaryPrimitives.ReadUInt16BigEndian(bytes.AsSpan(offset, 2));
        if (length < 2 || offset + length > bytes.Length)
        {
            return null;
        }

        if (marker is >= 0xC0 and <= 0xC3 or >= 0xC5 and <= 0xC7 or >= 0xC9 and <= 0xCB or >= 0xCD and <= 0xCF)
        {
            var height = BinaryPrimitives.ReadUInt16BigEndian(bytes.AsSpan(offset + 3, 2));
            var width = BinaryPrimitives.ReadUInt16BigEndian(bytes.AsSpan(offset + 5, 2));
            return new ImageMetadata(width, height, false);
        }

        offset += length;
    }

    return null;
}

static int FindJsonPropertyLine(string content, string propertyName, string value)
{
    var valueLiteral = JsonSerializer.Serialize(value, new JsonSerializerOptions
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    });
    var propertyLiteral = JsonSerializer.Serialize(propertyName);
    var propertyIndex = content.IndexOf(propertyLiteral, StringComparison.Ordinal);
    var valueIndex = -1;

    while (propertyIndex >= 0)
    {
        var nextValueIndex = content.IndexOf(valueLiteral, propertyIndex + propertyLiteral.Length, StringComparison.Ordinal);
        if (nextValueIndex >= 0)
        {
            valueIndex = nextValueIndex;
            break;
        }

        propertyIndex = content.IndexOf(propertyLiteral, propertyIndex + propertyLiteral.Length, StringComparison.Ordinal);
    }

    if (valueIndex < 0)
    {
        valueIndex = content.IndexOf(valueLiteral, StringComparison.Ordinal);
    }

    if (valueIndex < 0)
    {
        return 1;
    }

    return content.AsSpan(0, valueIndex).Count('\n') + 1;
}

static string ToRelativePath(string rootPath, string path) =>
    Path.GetRelativePath(rootPath, path).Replace('\\', '/');

static StoryGraphResponse BuildStoryGraph(WorkspacePaths workspace)
{
    var nodesById = new Dictionary<string, StoryNodeAccumulator>(StringComparer.Ordinal);
    var edges = new List<StoryGraphEdge>();
    var entrypoints = new List<StoryEntrypoint>();
    var diagnostics = new List<StoryDiagnostic>();
    var commandCounts = new Dictionary<string, int>(StringComparer.Ordinal);

    var storyDirectory = Path.Combine(workspace.DataPath, "story");
    var storyFiles = Directory.Exists(storyDirectory)
        ? Directory.EnumerateFiles(storyDirectory, "*.story.json", SearchOption.AllDirectories)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .ToArray()
        : Array.Empty<string>();

    foreach (var storyPath in storyFiles)
    {
        var relativePath = ToRelativePath(workspace.DataPath, storyPath);
        var content = File.ReadAllText(storyPath, Encoding.UTF8);
        var root = JsonNode.Parse(content) as JsonObject;
        var segments = root?["segments"] as JsonArray;
        if (segments is null)
        {
            diagnostics.Add(CreateStoryDiagnostic(
                "error",
                "剧情文件缺少 segments 数组。",
                null,
                relativePath,
                1));
            continue;
        }

        foreach (var segmentNode in segments.OfType<JsonObject>())
        {
            var segmentId = TryGetStringProperty(segmentNode, "name");
            if (string.IsNullOrWhiteSpace(segmentId))
            {
                diagnostics.Add(CreateStoryDiagnostic(
                    "error",
                    "剧情段落缺少 name。",
                    null,
                    relativePath,
                    1));
                continue;
            }

            var line = FindJsonPropertyLine(content, "name", segmentId);
            if (nodesById.ContainsKey(segmentId))
            {
                diagnostics.Add(CreateStoryDiagnostic(
                    "error",
                    $"剧情段落重复：{segmentId}。",
                    segmentId,
                    relativePath,
                    line));
                continue;
            }

            var groupId = InferStoryGroupId(segmentId);
            var groupName = FormatStoryGroupName(groupId);
            var node = new StoryNodeAccumulator(segmentId, groupId, groupName, relativePath, line);
            nodesById.Add(segmentId, node);

            var steps = segmentNode["steps"] as JsonArray;
            if (steps is null)
            {
                diagnostics.Add(CreateStoryDiagnostic(
                    "error",
                    $"剧情段落「{segmentId}」缺少 steps。",
                    segmentId,
                    relativePath,
                    line));
                continue;
            }

            AnalyzeStorySteps(
                steps,
                node,
                relativePath,
                content,
                edges,
                diagnostics,
                commandCounts,
                "流程",
                null);
        }
    }

    entrypoints.AddRange(ExtractStoryEntrypoints(workspace, diagnostics));

    foreach (var edge in edges)
    {
        if (nodesById.TryGetValue(edge.FromId, out var source))
        {
            source.Outgoing += 1;
        }

        if (nodesById.TryGetValue(edge.ToId, out var target))
        {
            target.Incoming += 1;
        }
        else
        {
            diagnostics.Add(CreateStoryDiagnostic(
                "error",
                $"剧情流向指向不存在的段落：{edge.ToId}。",
                edge.FromId,
                edge.SourcePath,
                edge.Line));
        }
    }

    foreach (var entrypoint in entrypoints)
    {
        if (nodesById.TryGetValue(entrypoint.TargetId, out var target))
        {
            target.ExternalEntrypoints += 1;
            target.Incoming += 1;
        }
        else
        {
            diagnostics.Add(CreateStoryDiagnostic(
                "error",
                $"剧情入口指向不存在的段落：{entrypoint.TargetId}。",
                null,
                entrypoint.SourcePath,
                entrypoint.Line));
        }
    }

    foreach (var node in nodesById.Values)
    {
        if (node.Incoming == 0)
        {
            diagnostics.Add(CreateStoryDiagnostic(
                "info",
                $"剧情段落「{node.Id}」没有已知入口或上游段落。",
                node.Id,
                node.Path,
                node.Line));
        }
    }

    var nodes = nodesById.Values
        .OrderBy(node => node.GroupName, StringComparer.OrdinalIgnoreCase)
        .ThenBy(node => node.Id, StringComparer.Ordinal)
        .Select(static node => node.ToResponse())
        .ToArray();

    var groups = nodesById.Values
        .GroupBy(static node => node.GroupId, StringComparer.Ordinal)
        .Select(group =>
        {
            var groupDiagnostics = diagnostics.Count(diagnostic => string.Equals(diagnostic.GroupId, group.Key, StringComparison.Ordinal));
            return new StoryGroupSummary(
                group.Key,
                FormatStoryGroupName(group.Key),
                group.Count(),
                group.Sum(static node => node.ExternalEntrypoints),
                group.Sum(static node => node.Incoming),
                group.Sum(static node => node.Outgoing),
                groupDiagnostics);
        })
        .OrderByDescending(static group => group.NodeCount)
        .ThenBy(static group => group.Name, StringComparer.OrdinalIgnoreCase)
        .ToArray();

    var commandStats = commandCounts
        .OrderByDescending(static pair => pair.Value)
        .ThenBy(static pair => pair.Key, StringComparer.Ordinal)
        .Select(static pair => new StoryCommandStat(pair.Key, pair.Value))
        .ToArray();

    return new StoryGraphResponse(
        new StoryGraphSummary(
            nodes.Length,
            groups.Length,
            edges.Count,
            entrypoints.Count,
            diagnostics.Count(static diagnostic => diagnostic.Severity == "error"),
            diagnostics.Count(static diagnostic => diagnostic.Severity == "warn"),
            diagnostics.Count(static diagnostic => diagnostic.Severity == "info")),
        groups,
        nodes,
        edges.OrderBy(static edge => edge.FromId, StringComparer.Ordinal).ThenBy(static edge => edge.Kind, StringComparer.Ordinal).ToArray(),
        entrypoints.OrderBy(static entrypoint => entrypoint.TargetId, StringComparer.Ordinal).ToArray(),
        diagnostics.OrderBy(static diagnostic => diagnostic.Severity, StoryDiagnosticSeverityComparer.Instance).ThenBy(static diagnostic => diagnostic.Path, StringComparer.OrdinalIgnoreCase).ToArray(),
        commandStats);
}

static void AnalyzeStorySteps(
    JsonArray steps,
    StoryNodeAccumulator node,
    string relativePath,
    string content,
    List<StoryGraphEdge> edges,
    List<StoryDiagnostic> diagnostics,
    Dictionary<string, int> commandCounts,
    string edgeLabel,
    string? condition)
{
    for (var index = 0; index < steps.Count; index += 1)
    {
        if (steps[index] is not JsonObject step)
        {
            continue;
        }

        node.StepCount += 1;
        var kind = TryGetStringProperty(step, "kind") ?? string.Empty;
        switch (kind)
        {
            case "dialogue":
                node.DialogueCount += 1;
                break;
            case "command":
                AnalyzeStoryCommand(step, node, relativePath, content, edges, diagnostics, commandCounts, edgeLabel, condition);
                break;
            case "jump":
                {
                    node.JumpCount += 1;
                    var target = TryGetStringProperty(step, "target");
                    if (!string.IsNullOrWhiteSpace(target))
                    {
                        edges.Add(new StoryGraphEdge(
                            node.Id,
                            target,
                            "jump",
                            edgeLabel,
                            condition,
                            relativePath,
                            FindJsonPropertyLine(content, "target", target)));
                    }

                    if (index < steps.Count - 1)
                    {
                        diagnostics.Add(CreateStoryDiagnostic(
                            "warn",
                            $"剧情段落「{node.Id}」的 jump 后还有同级步骤，这些步骤不会被执行。",
                            node.Id,
                            relativePath,
                            node.Line));
                    }

                    return;
                }
            case "call":
                {
                    node.CallCount += 1;
                    var target = TryGetStringProperty(step, "target");
                    if (!string.IsNullOrWhiteSpace(target))
                    {
                        edges.Add(new StoryGraphEdge(
                            node.Id,
                            target,
                            "call",
                            edgeLabel,
                            condition,
                            relativePath,
                            FindJsonPropertyLine(content, "target", target)));
                    }

                    break;
                }
            case "return":
                node.ReturnCount += 1;
                if (index < steps.Count - 1)
                {
                    diagnostics.Add(CreateStoryDiagnostic(
                        "warn",
                        $"剧情段落「{node.Id}」的 return 后还有同级步骤，这些步骤不会被执行。",
                        node.Id,
                        relativePath,
                        node.Line));
                }

                return;
            case "choice":
                AnalyzeStoryChoice(step, node, relativePath, content, edges, diagnostics, commandCounts, edgeLabel, condition);
                break;
            case "battle":
                AnalyzeStoryBattle(step, node, relativePath, content, edges, diagnostics, commandCounts, edgeLabel, condition);
                break;
            case "branch":
                AnalyzeStoryBranch(step, node, relativePath, content, edges, diagnostics, commandCounts, edgeLabel, condition);
                break;
        }
    }
}

static void AnalyzeStoryCommand(
    JsonObject step,
    StoryNodeAccumulator node,
    string relativePath,
    string content,
    List<StoryGraphEdge> edges,
    List<StoryDiagnostic> diagnostics,
    Dictionary<string, int> commandCounts,
    string edgeLabel,
    string? condition)
{
    node.CommandCount += 1;
    var name = TryGetStringProperty(step, "name") ?? string.Empty;
    if (!string.IsNullOrWhiteSpace(name))
    {
        commandCounts[name] = commandCounts.TryGetValue(name, out var count) ? count + 1 : 1;
    }

    var args = step["args"] as JsonArray;
    switch (name)
    {
        case "set_time_key":
            {
                var key = TryGetStringValue(args?.ElementAtOrDefault(0)) ?? "time_key";
                var target = TryGetStringValue(args?.ElementAtOrDefault(2));
                if (!string.IsNullOrWhiteSpace(target))
                {
                    edges.Add(new StoryGraphEdge(
                        node.Id,
                        target,
                        "time_key",
                        $"限时触发 {key}",
                        condition,
                        relativePath,
                        FindJsonPropertyLine(content, "name", name)));
                }

                break;
            }
        case "arena":
            {
                var target = TryGetStringValue(args?.ElementAtOrDefault(0));
                if (!string.IsNullOrWhiteSpace(target))
                {
                    edges.Add(new StoryGraphEdge(
                        node.Id,
                        target,
                        "dynamic",
                        "arena 回调",
                        condition,
                        relativePath,
                        FindJsonPropertyLine(content, "name", name)));
                }

                break;
            }
        case "xilian":
            AddFixedDynamicEdges(node, relativePath, content, edges, condition, name, "洗练", ["洗练_没有装备", "洗练选择", "洗练_洗练成功"]);
            break;
        case "huashan":
            AddFixedDynamicEdges(node, relativePath, content, edges, condition, name, "华山论剑", ["original_华山论剑分枝判断"]);
            break;
        case "trial":
            AddFixedDynamicEdges(node, relativePath, content, edges, condition, name, "试炼", ["original_试炼之地.失败", "霹雳堂_胜利"]);
            diagnostics.Add(CreateStoryDiagnostic(
                "info",
                "trial 指令还可能跳到角色专属段落：霹雳堂_<characterId>。",
                node.Id,
                relativePath,
                FindJsonPropertyLine(content, "name", name)));
            break;
        case "zhenlongqiju":
            AddFixedDynamicEdges(node, relativePath, content, edges, condition, name, "珍珑棋局", ["珍珑棋局_胜利", "珍珑棋局_失败"]);
            break;
    }

    if (name is "tower")
    {
        diagnostics.Add(CreateStoryDiagnostic(
            "info",
            "tower 指令会打开动态天关流程，无法静态推断目标剧情段落。",
            node.Id,
            relativePath,
            FindJsonPropertyLine(content, "name", name)));
    }
}

static void AnalyzeStoryChoice(
    JsonObject step,
    StoryNodeAccumulator node,
    string relativePath,
    string content,
    List<StoryGraphEdge> edges,
    List<StoryDiagnostic> diagnostics,
    Dictionary<string, int> commandCounts,
    string edgeLabel,
    string? condition)
{
    node.ChoiceCount += 1;
    var groups = step["groups"] as JsonArray;
    if (groups is null || groups.Count == 0)
    {
        diagnostics.Add(CreateStoryDiagnostic(
            "error",
            $"剧情段落「{node.Id}」里的选择没有任何选项组。",
            node.Id,
            relativePath,
            node.Line));
        return;
    }

    foreach (var group in groups.OfType<JsonObject>())
    {
        var groupCondition = group.TryGetPropertyValue("when", out var whenNode)
            ? FormatStoryExpression(whenNode)
            : null;
        var effectiveCondition = CombineStoryConditions(condition, groupCondition);
        var options = group["options"] as JsonArray;
        if (options is null || options.Count == 0)
        {
            diagnostics.Add(CreateStoryDiagnostic(
                "error",
                $"剧情段落「{node.Id}」里的选择组没有任何选项。",
                node.Id,
                relativePath,
                node.Line));
            continue;
        }

        foreach (var option in options.OfType<JsonObject>())
        {
            var optionText = TryGetStringProperty(option, "text") ?? "选项";
            if (option["steps"] is JsonArray optionSteps)
            {
                AnalyzeStorySteps(
                    optionSteps,
                    node,
                    relativePath,
                    content,
                    edges,
                    diagnostics,
                    commandCounts,
                    $"选择：{ShortenStoryText(optionText, 32)}",
                    effectiveCondition);
            }
        }
    }
}

static string? CombineStoryConditions(string? outer, string? inner)
{
    if (string.IsNullOrWhiteSpace(outer))
    {
        return string.IsNullOrWhiteSpace(inner) ? null : inner;
    }

    return string.IsNullOrWhiteSpace(inner) ? outer : $"({outer}) and ({inner})";
}

static void AnalyzeStoryBattle(
    JsonObject step,
    StoryNodeAccumulator node,
    string relativePath,
    string content,
    List<StoryGraphEdge> edges,
    List<StoryDiagnostic> diagnostics,
    Dictionary<string, int> commandCounts,
    string edgeLabel,
    string? condition)
{
    node.BattleCount += 1;
    var battleId = TryGetStringProperty(step, "battleId") ?? "battle";
    var outcomes = step["outcomes"] as JsonObject;
    if (outcomes is null || outcomes.Count == 0)
    {
        diagnostics.Add(CreateStoryDiagnostic(
            "error",
            $"剧情段落「{node.Id}」里的战斗「{battleId}」没有配置胜负结果。",
            node.Id,
            relativePath,
            FindJsonPropertyLine(content, "battleId", battleId)));
        return;
    }

    foreach (var outcome in outcomes)
    {
        if (outcome.Value is JsonArray outcomeSteps)
        {
            AnalyzeStorySteps(
                outcomeSteps,
                node,
                relativePath,
                content,
                edges,
                diagnostics,
                commandCounts,
                $"战斗「{battleId}」：{FormatBattleOutcome(outcome.Key)}",
                condition);
        }
    }
}

static void AnalyzeStoryBranch(
    JsonObject step,
    StoryNodeAccumulator node,
    string relativePath,
    string content,
    List<StoryGraphEdge> edges,
    List<StoryDiagnostic> diagnostics,
    Dictionary<string, int> commandCounts,
    string edgeLabel,
    string? condition)
{
    node.BranchCount += 1;
    var cases = step["cases"] as JsonArray;
    if (cases is null || cases.Count == 0)
    {
        diagnostics.Add(CreateStoryDiagnostic(
            "error",
            $"剧情段落「{node.Id}」里的条件分支没有任何条件项。",
            node.Id,
            relativePath,
            node.Line));
        return;
    }

    foreach (var branchCase in cases.OfType<JsonObject>())
    {
        var branchCondition = FormatStoryExpression(branchCase["when"]);
        if (branchCase["steps"] is JsonArray caseSteps)
        {
            AnalyzeStorySteps(
                caseSteps,
                node,
                relativePath,
                content,
                edges,
                diagnostics,
                commandCounts,
                $"条件：{ShortenStoryText(branchCondition, 36)}",
                branchCondition);
        }
    }

    if (step["fallback"] is JsonArray fallback)
    {
        AnalyzeStorySteps(
            fallback,
            node,
            relativePath,
            content,
            edges,
            diagnostics,
            commandCounts,
            "条件都不满足",
            condition);
    }
    else
    {
        diagnostics.Add(CreateStoryDiagnostic(
            "warn",
            $"剧情段落「{node.Id}」里的条件分支没有 fallback；如果所有条件都不满足，这段剧情会直接结束。",
            node.Id,
            relativePath,
            node.Line));
    }
}

static void AddFixedDynamicEdges(
    StoryNodeAccumulator node,
    string relativePath,
    string content,
    List<StoryGraphEdge> edges,
    string? condition,
    string commandName,
    string label,
    IReadOnlyList<string> targets)
{
    foreach (var target in targets)
    {
        edges.Add(new StoryGraphEdge(
            node.Id,
            target,
            "dynamic",
            label,
            condition,
            relativePath,
            FindJsonPropertyLine(content, "name", commandName)));
    }
}

static IReadOnlyList<StoryEntrypoint> ExtractStoryEntrypoints(
    WorkspacePaths workspace,
    List<StoryDiagnostic> diagnostics)
{
    var entrypoints = new List<StoryEntrypoint>();
    ExtractInitialStoryEntrypoint(workspace, entrypoints);
    ExtractMapStoryEntrypoints(workspace, entrypoints, diagnostics);
    ExtractWorldTriggerStoryEntrypoints(workspace, entrypoints, diagnostics);
    return entrypoints;
}

static void ExtractInitialStoryEntrypoint(WorkspacePaths workspace, List<StoryEntrypoint> entrypoints)
{
    var path = workspace.ResolveDataFile("game-config.json");
    if (!File.Exists(path))
    {
        return;
    }

    var relativePath = ToRelativePath(workspace.DataPath, path);
    var content = File.ReadAllText(path, Encoding.UTF8);
    if (JsonNode.Parse(content) is not JsonObject root)
    {
        return;
    }

    var target = TryGetStringProperty(root, "initialStorySegmentId");
    if (string.IsNullOrWhiteSpace(target))
    {
        return;
    }

    entrypoints.Add(new StoryEntrypoint(
        "initial",
        "开局剧情",
        "game-config.initialStorySegmentId",
        target,
        relativePath,
        FindJsonPropertyLine(content, "initialStorySegmentId", target),
        []));
}

static void ExtractMapStoryEntrypoints(
    WorkspacePaths workspace,
    List<StoryEntrypoint> entrypoints,
    List<StoryDiagnostic> diagnostics)
{
    var path = workspace.ResolveDataFile("maps.json");
    if (!File.Exists(path))
    {
        return;
    }

    var relativePath = ToRelativePath(workspace.DataPath, path);
    var content = File.ReadAllText(path, Encoding.UTF8);
    if (JsonNode.Parse(content) is not JsonArray maps)
    {
        return;
    }

    foreach (var map in maps.OfType<JsonObject>())
    {
        var mapId = TryGetStringProperty(map, "id") ?? "map";
        if (map["locations"] is not JsonArray locations)
        {
            continue;
        }

        foreach (var location in locations.OfType<JsonObject>())
        {
            var locationId = TryGetStringProperty(location, "id") ?? "location";
            if (location["events"] is not JsonArray events)
            {
                continue;
            }

            foreach (var mapEvent in events.OfType<JsonObject>())
            {
                if (!string.Equals(TryGetStringProperty(mapEvent, "type"), "story", StringComparison.Ordinal))
                {
                    continue;
                }

                var target = TryGetStringProperty(mapEvent, "targetId");
                if (string.IsNullOrWhiteSpace(target))
                {
                    diagnostics.Add(CreateStoryDiagnostic(
                        "error",
                        $"地图「{mapId}」点位「{locationId}」有 story 事件但缺少 targetId。",
                        null,
                        relativePath,
                        FindJsonPropertyLine(content, "type", "story")));
                    continue;
                }

                entrypoints.Add(new StoryEntrypoint(
                    "map",
                    $"地图：{mapId} / {locationId}",
                    $"{mapId}/{locationId}",
                    target,
                    relativePath,
                    FindJsonPropertyLine(content, "targetId", target),
                    ExtractMapConditionTexts(mapEvent)));
            }
        }
    }
}

static void ExtractWorldTriggerStoryEntrypoints(
    WorkspacePaths workspace,
    List<StoryEntrypoint> entrypoints,
    List<StoryDiagnostic> diagnostics)
{
    var path = workspace.ResolveDataFile("world-triggers.json");
    if (!File.Exists(path))
    {
        return;
    }

    var relativePath = ToRelativePath(workspace.DataPath, path);
    var content = File.ReadAllText(path, Encoding.UTF8);
    if (JsonNode.Parse(content) is not JsonArray triggers)
    {
        return;
    }

    foreach (var trigger in triggers.OfType<JsonObject>())
    {
        if (!string.Equals(TryGetStringProperty(trigger, "type"), "story", StringComparison.Ordinal))
        {
            continue;
        }

        var id = TryGetStringProperty(trigger, "id") ?? "world_trigger";
        var target = TryGetStringProperty(trigger, "targetId");
        if (string.IsNullOrWhiteSpace(target))
        {
            diagnostics.Add(CreateStoryDiagnostic(
            "error",
            $"世界触发器「{id}」缺少 targetId。",
                null,
                relativePath,
                FindJsonPropertyLine(content, "id", id)));
            continue;
        }

        entrypoints.Add(new StoryEntrypoint(
            "world",
            $"世界触发：{id}",
            id,
            target,
            relativePath,
            FindJsonPropertyLine(content, "targetId", target),
            ExtractMapConditionTexts(trigger)));
    }
}

static IReadOnlyList<string> ExtractMapConditionTexts(JsonObject owner)
{
    if (owner["conditions"] is not JsonArray conditions)
    {
        return [];
    }

    return conditions
        .OfType<JsonObject>()
        .Select(static condition =>
        {
            var type = TryGetStringProperty(condition, "type") ?? "condition";
            var value = TryGetStringProperty(condition, "value");
            return FormatMapCondition(type, value);
        })
        .ToArray();
}

static StoryDiagnostic CreateStoryDiagnostic(
    string severity,
    string message,
    string? segmentId,
    string path,
    int? line)
{
    var groupId = string.IsNullOrWhiteSpace(segmentId) ? null : InferStoryGroupId(segmentId);
    return new StoryDiagnostic(severity, groupId, segmentId, message, path, line);
}

static string InferStoryGroupId(string segmentId)
{
    var normalized = segmentId.Trim();
    foreach (var separator in new[] { '_', '.', '：', ':' })
    {
        var index = normalized.IndexOf(separator, StringComparison.Ordinal);
        if (index > 0)
        {
            return normalized[..index];
        }
    }

    return normalized.Length <= 8 ? normalized : normalized[..8];
}

static string FormatStoryGroupName(string groupId) => groupId switch
{
    "mainStory" => "主线",
    "original" => "原版迁移",
    _ => groupId,
};

static string FormatStoryExpression(JsonNode? node)
{
    if (node is null)
    {
        return "";
    }

    if (node is JsonValue)
    {
        return TryGetStringValue(node) ?? node.ToJsonString();
    }

    if (node is not JsonArray array || array.Count == 0)
    {
        return node.ToJsonString();
    }

    var op = TryGetStringValue(array[0]) ?? "";
    return op switch
    {
        "var" => FormatStoryVariable(TryGetStringValue(array.ElementAtOrDefault(1)) ?? "var"),
        "pred" => FormatStoryPredicate(array),
        "not" => $"not ({FormatStoryExpression(array.ElementAtOrDefault(1))})",
        "and" or "or" or "==" or "!=" or ">" or ">=" or "<" or "<=" =>
            $"{FormatStoryExpression(array.ElementAtOrDefault(1))} {FormatStoryOperator(op)} {FormatStoryExpression(array.ElementAtOrDefault(2))}",
        "list" => $"[{string.Join(", ", array.Skip(1).Select(FormatStoryExpression))}]",
        _ => node.ToJsonString(),
    };
}

static string FormatStoryPredicate(JsonArray array)
{
    var name = TryGetStringValue(array.ElementAtOrDefault(1)) ?? "pred";
    var args = array.Skip(2).Select(FormatStoryExpression).ToArray();
    return name switch
    {
        "always" => "总是",
        "should_finish" when args.Length >= 1 => $"已完成：{args[0]}",
        "should_not_finish" when args.Length >= 1 => $"未完成：{args[0]}",
        "follow_story" when args.Length >= 1 => $"上一段是：{args[0]}",
        "has_time_key" when args.Length >= 1 => $"有时间钥匙：{args[0]}",
        "not_has_time_key" when args.Length >= 1 => $"没有时间钥匙：{args[0]}",
        "have_item" when args.Length >= 1 => args.Length >= 2 ? $"持有物品：{args[0]} x{args[1]}" : $"持有物品：{args[0]}",
        "not_have_item" when args.Length >= 1 => args.Length >= 2 ? $"没有物品：{args[0]} x{args[1]}" : $"没有物品：{args[0]}",
        "have_money" or "silver_at_least" when args.Length >= 1 => $"银两 >= {args[0]}",
        "gold_at_least" or "have_yuanbao" when args.Length >= 1 => $"元宝 >= {args[0]}",
        "friendCount" when args.Length >= 1 => $"队伍人数 >= {args[0]}",
        "current_map" when args.Length >= 1 => $"当前地图：{args[0]}",
        "event_completed" or "event_finished" when args.Length >= 1 => $"地图事件已完成：{args[0]}",
        "event_not_completed" or "event_not_finished" when args.Length >= 1 => $"地图事件未完成：{args[0]}",
        "time_slot" or "in_time" when args.Length >= 1 => $"时辰是：{string.Join(" / ", args)}",
        "not_in_time" when args.Length >= 1 => $"时辰不是：{string.Join(" / ", args)}",
        "key_in_team" or "in_team" when args.Length >= 1 => $"队伍有：{args[0]}",
        "key_not_in_team" or "not_in_team" when args.Length >= 1 => $"队伍没有：{args[0]}",
        "level_greater_than" when args.Length >= 2 => $"{args[0]} 等级 >= {args[1]}",
        "character_level_less_than" when args.Length >= 2 => $"{args[0]} 等级 < {args[1]}",
        "skill_more_than" or "character_skill_more_than" when args.Length >= 3 => $"{args[0]} 的 {args[1]} >= {args[2]}",
        "skill_less_than" or "character_skill_less_than" when args.Length >= 3 => $"{args[0]} 的 {args[1]} < {args[2]}",
        "exceed_day" when args.Length >= 1 => $"天数 > {args[0]}",
        "not_exceed_day" when args.Length >= 1 => $"天数 <= {args[0]}",
        "in_round" when args.Length >= 1 => $"周目 = {args[0]}",
        "not_in_round" when args.Length >= 1 => $"周目 != {args[0]}",
        "zhoumu_greater_than" when args.Length >= 1 => $"周目 >= {args[0]}",
        "game_mode" when args.Length >= 1 => $"难度：{args[0]}",
        "in_menpai" or "in_sect" when args.Length >= 1 => $"门派是：{args[0]}",
        "not_in_menpai" or "not_in_sect" when args.Length >= 1 => $"门派不是：{args[0]}",
        "probability" when args.Length >= 1 => $"概率 {args[0]}%",
        "daode_more_than" when args.Length >= 1 => $"道德 >= {args[0]}",
        "daode_less_than" when args.Length >= 1 => $"道德 < {args[0]}",
        "haogan_more_than" when args.Length == 1 => $"好感 >= {args[0]}",
        "haogan_less_than" when args.Length == 1 => $"好感 < {args[0]}",
        "haogan_more_than" when args.Length >= 2 => $"{args[0]} 好感 >= {args[1]}",
        "haogan_less_than" when args.Length >= 2 => $"{args[0]} 好感 < {args[1]}",
        "rank" when args.Length >= 1 => $"江湖地位 <= {args[0]}",
        _ => args.Length == 0 ? $"{name}()" : $"{name}({string.Join(", ", args)})",
    };
}

static string FormatBattleOutcome(string outcome) => outcome switch
{
    "win" => "胜利",
    "lose" => "失败",
    "timeout" => "超时",
    _ => outcome,
};

static string FormatStoryVariable(string variableName) => variableName switch
{
    "round" => "周目",
    "game_mode" => "难度",
    "money" or "silver" => "银两",
    "gold" or "yuanbao" => "元宝",
    _ => variableName,
};

static string FormatStoryOperator(string op) => op switch
{
    "and" => "且",
    "or" => "或",
    "==" => "=",
    "!=" => "!=",
    _ => op,
};

static string FormatMapCondition(string type, string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return type;
    }

    return type switch
    {
        "should_finish" => $"已完成：{value}",
        "should_not_finish" => $"未完成：{value}",
        "in_team" or "key_in_team" => $"队伍有：{value}",
        "not_in_team" or "key_not_in_team" => $"队伍没有：{value}",
        "in_menpai" or "in_sect" => $"门派是：{value}",
        "not_in_menpai" or "not_in_sect" => $"门派不是：{value}",
        "level_greater_than" => FormatPackedComparison(value, "等级 >="),
        "character_level_less_than" => FormatPackedComparison(value, "等级 <"),
        "exceed_day" => $"天数 > {value}",
        "not_exceed_day" => $"天数 <= {value}",
        "probability" => $"概率 {value}%",
        _ => $"{type}: {value}",
    };
}

static string FormatPackedComparison(string value, string label)
{
    var parts = value.Split('#', 2, StringSplitOptions.TrimEntries);
    return parts.Length == 2 ? $"{parts[0]} {label} {parts[1]}" : $"{label} {value}";
}

static string? TryGetStringValue(JsonNode? node)
{
    return node is JsonValue value && value.TryGetValue<string>(out var text)
        ? text
        : null;
}

static string ShortenStoryText(string text, int maxLength)
{
    var normalized = text.Replace("\r", "", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal).Trim();
    return normalized.Length <= maxLength ? normalized : normalized[..maxLength] + "...";
}

sealed class StoryDiagnosticSeverityComparer : IComparer<string>
{
    public static StoryDiagnosticSeverityComparer Instance { get; } = new();

    public int Compare(string? x, string? y) => Rank(x).CompareTo(Rank(y));

    private static int Rank(string? severity) => severity switch
    {
        "error" => 0,
        "warn" => 1,
        "info" => 2,
        _ => 3,
    };
}

sealed class WorkspaceSession
{
    private readonly object _sync = new();
    private WorkspacePaths? _current;
    private string? _message;

    public WorkspaceSession(string? initialRootPath)
    {
        if (string.IsNullOrWhiteSpace(initialRootPath))
        {
            return;
        }

        try
        {
            _current = OpenValidated(initialRootPath);
        }
        catch (Exception ex)
        {
            _message = ex.Message;
        }
    }

    public bool IsOpen
    {
        get
        {
            lock (_sync)
            {
                return _current is not null;
            }
        }
    }

    public WorkspacePaths RequireCurrent()
    {
        lock (_sync)
        {
            return _current ?? throw new InvalidOperationException("请先打开创作工作区。");
        }
    }

    public WorkspaceResponse Describe()
    {
        lock (_sync)
        {
            return _current is null
                ? WorkspaceResponse.Closed(_message)
                : WorkspaceResponse.From(_current);
        }
    }

    public WorkspaceResponse Open(string rootPath)
    {
        var next = OpenValidated(rootPath);
        var response = WorkspaceResponse.From(next);
        lock (_sync)
        {
            _current = next;
            _message = null;
            return response;
        }
    }

    private static WorkspacePaths OpenValidated(string rootPath)
    {
        var workspace = WorkspacePaths.Open(rootPath);
        if (!workspace.DiscoverMods().Any(static mod => mod.DataExists))
        {
            throw new InvalidOperationException(
                $"工作区中没有同时包含 mod.json 和 data/ 的可编辑 MOD：{workspace.RootPath}");
        }

        return workspace;
    }
}

sealed class WorkspacePaths
{
    public const string DefaultModId = "jyxr-base";

    private WorkspacePaths(string rootPath, string modId, string? modPath = null)
    {
        RootPath = rootPath;
        ModId = modId;
        ModsPath = Path.Combine(rootPath, "mods");
        ModPath = modPath ?? Path.Combine(ModsPath, modId);
        DataPath = Path.Combine(ModPath, "data");
        AssetsPath = Path.Combine(rootPath, "assets");
        BackupPath = Path.Combine(ModPath, ".jyxr-editor", "backups");
    }

    public string RootPath { get; }
    public string ModId { get; }
    public string ModsPath { get; }
    public string ModPath { get; }
    public string DataPath { get; }
    public string AssetsPath { get; }
    public string BackupPath { get; }

    public static WorkspacePaths Open(string rootPath)
    {
        if (string.IsNullOrWhiteSpace(rootPath))
        {
            throw new InvalidOperationException("请输入创作工作区路径。");
        }

        var fullPath = Path.TrimEndingDirectorySeparator(Path.GetFullPath(rootPath.Trim()));
        if (!Directory.Exists(fullPath))
        {
            throw new DirectoryNotFoundException($"找不到创作工作区：{fullPath}");
        }

        var modsPath = Path.Combine(fullPath, "mods");
        if (!Directory.Exists(modsPath))
        {
            throw new InvalidOperationException($"创作工作区必须包含 mods/ 目录：{fullPath}");
        }

        return new WorkspacePaths(fullPath, DefaultModId);
    }

    public WorkspacePaths ForMod(string? modId)
    {
        var normalized = NormalizeModId(modId);
        var discoveredMod = DiscoverMods()
            .FirstOrDefault(mod => string.Equals(mod.Id, normalized, StringComparison.Ordinal));
        var modPath = discoveredMod is null
            ? ResolveChildPath(ModsPath, normalized)
            : ResolveChildPath(RootPath, discoveredMod.Path);
        if (!File.Exists(Path.Combine(modPath, "mod.json")))
        {
            throw new InvalidOperationException($"当前工作区中找不到 MOD：{normalized}");
        }

        return new WorkspacePaths(RootPath, normalized, modPath);
    }

    public IReadOnlyList<ModSummary> DiscoverMods()
    {
        if (!Directory.Exists(ModsPath))
        {
            return Array.Empty<ModSummary>();
        }

        var mods = new List<ModSummary>();
        foreach (var manifestPath in Directory.EnumerateFiles(ModsPath, "mod.json", SearchOption.AllDirectories)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase))
        {
            var modPath = Path.GetDirectoryName(manifestPath);
            if (modPath is null || !string.Equals(Path.GetDirectoryName(modPath), ModsPath, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            try
            {
                var manifest = JsonNode.Parse(File.ReadAllText(manifestPath, Encoding.UTF8)) as JsonObject;
                var id = TryGetManifestStringProperty(manifest, "id");
                if (string.IsNullOrWhiteSpace(id))
                {
                    id = Path.GetFileName(modPath);
                }

                mods.Add(new ModSummary(
                    id,
                    TryGetManifestStringProperty(manifest, "name") ?? id,
                    TryGetManifestStringProperty(manifest, "version") ?? "",
                    TryGetManifestStringProperty(manifest, "author") ?? "",
                    TryGetManifestStringProperty(manifest, "date") ?? "",
                    TryGetManifestStringProperty(manifest, "description") ?? "",
                    ToRelativeWorkspacePath(RootPath, modPath),
                    Directory.Exists(Path.Combine(modPath, "data"))));
            }
            catch
            {
                var id = Path.GetFileName(modPath);
                mods.Add(new ModSummary(id, id, "", "", "", "mod.json 解析失败", ToRelativeWorkspacePath(RootPath, modPath), false));
            }
        }

        return mods
            .OrderByDescending(static mod => mod.Id == DefaultModId)
            .ThenBy(static mod => mod.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public string ResolveDataFile(string relativePath)
    {
        var path = ResolveChildPath(DataPath, relativePath);
        if (!string.Equals(Path.GetExtension(path), ".json", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Data file path must end with .json.");
        }

        return path;
    }

    public string ResolveDataTextFile(string relativePath)
    {
        var path = ResolveChildPath(DataPath, relativePath);
        if (!path.EndsWith(".json", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".story", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Data file path must end with .json or .story.");
        }

        return path;
    }

    public string ResolveStorySourceFile(string relativePath)
    {
        var path = ResolveChildPath(DataPath, relativePath);
        if (!path.EndsWith(".story", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Story source path must end with .story.");
        }

        return path;
    }

    public string ResolveAssetFile(string relativePath) => ResolveChildPath(AssetsPath, relativePath);

    private static string? TryGetManifestStringProperty(JsonObject? obj, string propertyName)
    {
        return obj is not null &&
            obj.TryGetPropertyValue(propertyName, out var node) &&
            node is JsonValue value &&
            value.TryGetValue<string>(out var text)
                ? text
                : null;
    }

    private static string ToRelativeWorkspacePath(string rootPath, string path) =>
        Path.GetRelativePath(rootPath, path).Replace('\\', '/');

    private static string NormalizeModId(string? modId)
    {
        var normalized = string.IsNullOrWhiteSpace(modId) ? DefaultModId : modId.Trim();
        if (normalized.Split('/').Any(static part => part is "" or "." or "..") ||
            normalized.Contains('\\', StringComparison.Ordinal) ||
            Path.IsPathFullyQualified(normalized) ||
            Path.IsPathRooted(normalized))
        {
            throw new InvalidOperationException($"Invalid MOD id: {modId}");
        }

        return normalized;
    }

    private static string ResolveChildPath(string rootPath, string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new InvalidOperationException("Path is required.");
        }

        var trimmed = relativePath.Trim();
        if (Path.IsPathFullyQualified(trimmed) ||
            Path.IsPathRooted(trimmed) ||
            trimmed.StartsWith("res://", StringComparison.Ordinal) ||
            trimmed.StartsWith("user://", StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"Path must stay inside the workspace directory: {relativePath}");
        }

        var normalized = trimmed.Replace('\\', '/');
        if (normalized.Split('/').Any(static part => part is "" or "." or ".."))
        {
            throw new InvalidOperationException($"Path must stay inside the workspace directory: {relativePath}");
        }

        var rootFullPath = Path.GetFullPath(rootPath);
        var fullPath = Path.GetFullPath(Path.Combine(rootFullPath, normalized));
        var rootWithSeparator = rootFullPath.EndsWith(Path.DirectorySeparatorChar)
            ? rootFullPath
            : rootFullPath + Path.DirectorySeparatorChar;
        if (!fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Path must stay inside the workspace directory: {relativePath}");
        }

        return fullPath;
    }
}

sealed record WorkspaceResponse(
    bool IsOpen,
    string? Message,
    string RootPath,
    string ModsPath,
    string DefaultModId,
    IReadOnlyList<ModSummary> Mods,
    string DataPath,
    bool DataExists,
    string AssetsPath,
    bool AssetsExists)
{
    public static WorkspaceResponse Closed(string? message) => new(
        false,
        message,
        string.Empty,
        string.Empty,
        WorkspacePaths.DefaultModId,
        Array.Empty<ModSummary>(),
        string.Empty,
        false,
        string.Empty,
        false);

    public static WorkspaceResponse From(WorkspacePaths workspace)
    {
        var mods = workspace.DiscoverMods();
        var defaultModId = mods.Any(static mod =>
            mod.Id == WorkspacePaths.DefaultModId && mod.DataExists)
            ? WorkspacePaths.DefaultModId
            : mods.First(static mod => mod.DataExists).Id;
        var defaultMod = workspace.ForMod(defaultModId);
        return new WorkspaceResponse(
            true,
            null,
            workspace.RootPath,
            workspace.ModsPath,
            defaultModId,
            mods,
            defaultMod.DataPath,
            Directory.Exists(defaultMod.DataPath),
            workspace.AssetsPath,
            Directory.Exists(workspace.AssetsPath));
    }
}

sealed record OpenWorkspaceRequest(string Path);

sealed record WorkspacePickResponse(
    bool Supported,
    bool Canceled,
    string? Path,
    string? Message);

sealed record ModSummary(
    string Id,
    string Name,
    string Version,
    string Author,
    string Date,
    string Description,
    string Path,
    bool DataExists);

sealed record FileEntry(
    string Path,
    string Name,
    string Extension,
    long Size,
    DateTime ModifiedAtUtc);

sealed record FileContentResponse(string Path, string Content);

sealed record SaveFileRequest(string Path, string Content);

sealed record SaveFileResponse(
    string Path,
    string Content,
    string? BackupPath,
    ValidationResponse Validation);

sealed record SaveStorySourceRequest(
    string Path,
    string Content,
    string CompiledJson);

sealed record SaveStoryJsonAsSourceRequest(
    string JsonPath,
    string Content,
    string CompiledJson);

sealed record SaveStorySourceResponse(
    string Path,
    string Content,
    string CompiledJsonPath,
    string CompiledJsonContent,
    string? SourceBackupPath,
    string? JsonBackupPath,
    ValidationResponse Validation);

sealed record CreateStorySourceRequest(
    string FileName,
    string? SegmentName);

sealed record CreateStorySourceResponse(
    string Path,
    string Content,
    string CompiledJsonPath);

sealed record CreateSpeakerRequest(
    string Id,
    string? Name,
    string? PortraitId,
    string? AssetValue,
    string? Gender);

sealed record CreateSpeakerResponse(
    string Id,
    string Name,
    string PortraitId,
    string AssetValue,
    IReadOnlyList<string> BackupPaths,
    ValidationResponse Validation);

sealed record CreatePortraitResourceRequest(
    string PortraitId,
    string AssetValue);

sealed record UpdatePortraitResourceRequest(
    string PortraitId,
    string AssetValue,
    string? ExpectedAssetValue);

sealed record CreatePortraitResourceResponse(
    string PortraitId,
    string AssetValue,
    string? BackupPath,
    ValidationResponse Validation);

sealed record CreateItemResourceRequest(
    string PictureId,
    string AssetValue);

sealed record CreateItemResourceResponse(
    string PictureId,
    string AssetValue,
    string? BackupPath,
    ValidationResponse Validation);

sealed record CreateResourceRequest(
    string Id,
    string Group,
    string Value);

sealed record CreateResourceResponse(
    string Id,
    string Group,
    string Value,
    string? BackupPath,
    ValidationResponse Validation);

sealed record NormalizePortraitRequest(string Path, string PngBase64);

sealed record NormalizePortraitResponse(
    string Path,
    string? BackupPath,
    long Size,
    DateTime ModifiedAtUtc);

sealed record UploadItemImageRequest(
    string ItemId,
    string PictureId,
    string FileName,
    string MimeType,
    string ImageBase64,
    string PreflightToken,
    bool AllowAssetOverwrite);

sealed record ItemImageUploadPreflightRequest(
    string ItemId,
    string PictureId,
    string FileName,
    string MimeType);

sealed record ItemImageUploadPreflightResponse(
    bool CanApply,
    string Message,
    string Token,
    string ItemId,
    string PictureId,
    string AssetValue,
    string AssetPath,
    string ResourceAction,
    string? ExistingResourceGroup,
    string? ExistingResourceValue,
    bool AssetExists,
    DateTime? AssetModifiedAtUtc);

sealed record UploadItemImageResponse(
    string ItemId,
    string PictureId,
    string AssetValue,
    string AssetPath,
    bool ResourceChanged,
    string? ResourceBackupPath,
    string? AssetBackupPath,
    ValidationResponse Validation);

sealed record PortraitCheckResponse(
    bool Ok,
    PortraitCheckSummary Summary,
    IReadOnlyList<PortraitCheckIssue> Issues);

sealed record PortraitCheckSummary(
    int CharacterCount,
    int PortraitResourceCount,
    int StorySpeakerCount,
    int CheckedPortraitCount,
    int Errors,
    int Warnings,
    int Infos);

sealed record PortraitCheckIssue(
    string Severity,
    string Area,
    string Message,
    string? DataPath,
    int? Line,
    string? DefinitionId,
    string? AssetPath,
    bool AssetExists);

sealed record StorySpeakerReference(string Name, string Path, int Line);

sealed record StoryGraphResponse(
    StoryGraphSummary Summary,
    IReadOnlyList<StoryGroupSummary> Groups,
    IReadOnlyList<StoryGraphNode> Nodes,
    IReadOnlyList<StoryGraphEdge> Edges,
    IReadOnlyList<StoryEntrypoint> Entrypoints,
    IReadOnlyList<StoryDiagnostic> Diagnostics,
    IReadOnlyList<StoryCommandStat> Commands);

sealed record StoryGraphSummary(
    int NodeCount,
    int GroupCount,
    int EdgeCount,
    int EntrypointCount,
    int Errors,
    int Warnings,
    int Infos);

sealed record StoryGroupSummary(
    string Id,
    string Name,
    int NodeCount,
    int EntrypointCount,
    int IncomingCount,
    int OutgoingCount,
    int DiagnosticCount);

sealed record StoryGraphNode(
    string Id,
    string GroupId,
    string GroupName,
    string Path,
    int Line,
    int StepCount,
    int DialogueCount,
    int CommandCount,
    int ChoiceCount,
    int BranchCount,
    int BattleCount,
    int JumpCount,
    int CallCount,
    int ReturnCount,
    int Incoming,
    int Outgoing,
    int ExternalEntrypoints);

sealed record StoryGraphEdge(
    string FromId,
    string ToId,
    string Kind,
    string Label,
    string? Condition,
    string SourcePath,
    int? Line);

sealed record StoryEntrypoint(
    string Kind,
    string Label,
    string SourceId,
    string TargetId,
    string SourcePath,
    int? Line,
    IReadOnlyList<string> Conditions);

sealed record StoryDiagnostic(
    string Severity,
    string? GroupId,
    string? SegmentId,
    string Message,
    string Path,
    int? Line);

sealed record StoryCommandStat(string Name, int Count);

sealed class StoryNodeAccumulator
{
    public StoryNodeAccumulator(string id, string groupId, string groupName, string path, int line)
    {
        Id = id;
        GroupId = groupId;
        GroupName = groupName;
        Path = path;
        Line = line;
    }

    public string Id { get; }
    public string GroupId { get; }
    public string GroupName { get; }
    public string Path { get; }
    public int Line { get; }
    public int StepCount { get; set; }
    public int DialogueCount { get; set; }
    public int CommandCount { get; set; }
    public int ChoiceCount { get; set; }
    public int BranchCount { get; set; }
    public int BattleCount { get; set; }
    public int JumpCount { get; set; }
    public int CallCount { get; set; }
    public int ReturnCount { get; set; }
    public int Incoming { get; set; }
    public int Outgoing { get; set; }
    public int ExternalEntrypoints { get; set; }

    public StoryGraphNode ToResponse() => new(
        Id,
        GroupId,
        GroupName,
        Path,
        Line,
        StepCount,
        DialogueCount,
        CommandCount,
        ChoiceCount,
        BranchCount,
        BattleCount,
        JumpCount,
        CallCount,
        ReturnCount,
        Incoming,
        Outgoing,
        ExternalEntrypoints);
}

sealed record AssetResolution(string? ExistingRelativePath, string PreferredRelativePath);

sealed record ImageMetadata(int Width, int Height, bool? HasAlpha);

sealed record ValidationResponse(
    bool Ok,
    string Message,
    ValidationSummary Summary,
    IReadOnlyList<ValidationIssue> Issues);

sealed record ValidationSummary(
    int JsonFileCount,
    int ContractVersion,
    int Errors,
    int Warnings,
    int Suggestions);

sealed record ValidationIssue(
    string Code,
    string Severity,
    string Category,
    string Message,
    string? Path,
    int? Line,
    string? DefinitionId);

sealed record ErrorResponse(string Message);
