using GameHost.WebSockets;

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.AddSingleton(new WebSocketHandler());

builder.WebHost.UseUrls("http://*:42069");

var app = builder.Build();

app.UseFileServer();
app.UseWebSockets(new() { KeepAliveInterval = TimeSpan.FromSeconds(10) });

app.Map("/ws", async (HttpContext context, WebSocketHandler handler, CancellationToken token) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var ws = await context.WebSockets.AcceptWebSocketAsync();

        await handler.HandleWebSocketAsync(ws, token);
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
    }
});

app.Run();
