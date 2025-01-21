using System.Buffers;
using System.Net.WebSockets;

namespace GameHost.WebSockets;

public sealed class WebSocketHandler
{
    private readonly List<WebSocket> _webSockets = new();

    public async Task HandleWebSocketAsync(WebSocket ws, CancellationToken token)
    {
        _webSockets.Add(ws);

        var id = ws.GetHashCode();

        Console.WriteLine($"Device {id} added");

        var buffer = ArrayPool<byte>.Shared.Rent(1024 * 4);
        var memory = new Memory<byte>(buffer);

        try
        {
            while (ws.State == WebSocketState.Open)
            {
                var result = await ws.ReceiveAsync(memory, token);

                if (result.Count > 0)
                {
                    Console.WriteLine($"Device {id} sending data");

                    var data = memory[..result.Count];

                    await Task.WhenAll(
                        _webSockets.Except([ws])
                        .Select(async ws => await ws.SendAsync(data, result.MessageType, true, token))
                        .ToArray());
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Device failed with error {ex.Message}");
        }
        finally
        {
            _webSockets.Remove(ws);
            ArrayPool<byte>.Shared.Return(buffer);

            Console.WriteLine($"Device {id} removed");
        }
    }
}
