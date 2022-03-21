程式執行方式:
1. 安裝node.js
2. 開啟終端機
3. 終端機進入此資料夾
3. 在終端機使用node執行httpsserver或server
4. 直播端在瀏覽器進入網址【https://server_ip:8001/vr/camera.html】，並點擊stream鈕
5. 觀看端在瀏覽器進入網址【https://server_ip:8001/vr/watcher.html】，並點擊watch鈕

說明:
0. httpsserver和server為主程式，擇一執行即可 (httpsserver可以透過外網連接伺服器，server只能在本機端測試使用)
1. 在執行時主要使用【vr】資料夾下的文件，其餘為測試時建立的資料夾(懶得刪)；若要刪除多餘的檔案，刪除後須修改主程式程式碼
2. 多餘的資料夾:
	2-1. ex，webrtc官方範例
	2-2. exex，魔改後的官方範例
	2-3. test，測試用