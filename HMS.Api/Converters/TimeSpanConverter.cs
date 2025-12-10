using System.Text.Json;
using System.Text.Json.Serialization;

namespace HMS.Api.Converters;

public class TimeSpanConverter : JsonConverter<TimeSpan>
{
    public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
            return TimeSpan.Zero;
        
        if (TimeSpan.TryParse(value, out var timeSpan))
            return timeSpan;
        
        // Try parsing as "HH:mm:ss" format
        var parts = value.Split(':');
        if (parts.Length >= 2 && int.TryParse(parts[0], out var hours) && int.TryParse(parts[1], out var minutes))
        {
            var seconds = parts.Length > 2 && int.TryParse(parts[2], out var s) ? s : 0;
            return new TimeSpan(hours, minutes, seconds);
        }
        
        return TimeSpan.Zero;
    }

    public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(@"hh\:mm\:ss"));
    }
}

public class NullableTimeSpanConverter : JsonConverter<TimeSpan?>
{
    public override TimeSpan? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;
        
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
            return null;
        
        if (TimeSpan.TryParse(value, out var timeSpan))
            return timeSpan;
        
        // Try parsing as "HH:mm:ss" format
        var parts = value.Split(':');
        if (parts.Length >= 2 && int.TryParse(parts[0], out var hours) && int.TryParse(parts[1], out var minutes))
        {
            var seconds = parts.Length > 2 && int.TryParse(parts[2], out var s) ? s : 0;
            return new TimeSpan(hours, minutes, seconds);
        }
        
        return null;
    }

    public override void Write(Utf8JsonWriter writer, TimeSpan? value, JsonSerializerOptions options)
    {
        if (value == null)
            writer.WriteNullValue();
        else
            writer.WriteStringValue(value.Value.ToString(@"hh\:mm\:ss"));
    }
}
