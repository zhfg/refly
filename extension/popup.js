document.addEventListener("DOMContentLoaded", function () {
  chrome.history.search({ text: "", maxResults: 10 }, function (data) {
    console.log("data", data);
    var historyDiv = document.getElementById("history");
    var historyList = "<ul>";
    data.forEach(function (page) {
      historyList +=
        '<li><a href="' + page.url + '">' + page.title + "</a></li>";
    });
    historyList += "</ul>";
    historyDiv.innerHTML = historyList;
  });
});
