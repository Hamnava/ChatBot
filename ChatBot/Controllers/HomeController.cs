using ChatBot.Models;
using ChatBot.Services;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace ChatBot.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly LlmService _llmService;

        public HomeController(ILogger<HomeController> logger, LlmService llmService)
        {
            _logger = logger;
            _llmService = llmService;
        }

        [HttpPost]
        public async Task<IActionResult> Ask([FromBody] PromptRequest request)
        {
            var prompt = request.Prompt;
            var response = await _llmService.GetResponseAsync(prompt);
            return Json(new { text = response });
        }


        public IActionResult Index()
        {
            return View();
        }

        public IActionResult MultiFunctional()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
