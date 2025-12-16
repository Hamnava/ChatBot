using ChatBot.Models;
using ChatBot.Services;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);


// Bind OpenAI settings
builder.Services.Configure<OpenAIOptions>(
    builder.Configuration.GetSection("OpenAI"));

// Register LlmService with DI
builder.Services.AddSingleton<LlmService>(sp =>
{
    var options = sp.GetRequiredService<IOptions<OpenAIOptions>>().Value;
    return new LlmService(options.ApiKey);
});

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
