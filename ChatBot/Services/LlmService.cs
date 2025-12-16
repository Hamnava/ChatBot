using OpenAI;
using OpenAI.Chat;
namespace ChatBot.Services
{
    public class LlmService
    {
        private readonly OpenAIClient _client;

        public LlmService(string apiKey)
        {
            _client = new OpenAIClient(apiKey);
        }

        public async Task<string> GetResponseAsync(string prompt)
        {
            try
            {
                var chatRequest = new ChatRequest(
                new List<Message>
                {
                new Message(Role.User, prompt)
                },
                model: "gpt-4o-mini"
            );

                var response = await _client.ChatEndpoint.GetCompletionAsync(chatRequest);
                var messageElement = response.FirstChoice.Message.Content;

                // Extract the string safely
                string message = messageElement.GetString();

                return message;
            }
            catch (Exception ex)
            {

                throw;
            }

        }
    }
}