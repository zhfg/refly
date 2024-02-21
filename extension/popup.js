document.addEventListener("DOMContentLoaded", function () {
  const microsecondsPerDay = 1000 * 60 * 60 * 24;
  const daysPerMonth = 30; // 这里简单地假设一个月是30天，实际情况可能会有所不同
  const microsecondsPerMonth = microsecondsPerDay * daysPerMonth;

  chrome.history.search(
    { text: "", startTime: microsecondsPerMonth, maxResults: 50000 },
    function (data) {
      console.log("data", data);
      var historyDiv = document.getElementById("history");
      var historyList = "<ul>";
      data.forEach(function (page) {
        historyList +=
          '<li><a href="' + page.url + '">' + page.title + "</a></li>";
      });
      historyList += "</ul>";
      historyDiv.innerHTML = historyList;
    }
  );
});
