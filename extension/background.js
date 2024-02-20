// 初次安装
chrome.runtime.onInstalled.addListener(() => {});

// TODO: 这里需要
// 初次加载，获取过去一个月最多 5000 个网页历史
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

// 获取新的访问页面，增量处理
chrome.history.onVisited.addListener((result) => {
  console.log("new visited results", result);
});
