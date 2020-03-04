$(document).ready(function () {
  var url = "http://192.168.1.124:7878";

  var loc = location.href;//获取整个跳转地址内容，其实就是你传过来的整个地址字符串
  console.log("我的地址" + loc);
  var n1 = loc.length;//地址的总长
  var n2 = loc.indexOf("?");//取得=号的位置
  var parameter = decodeURI(loc.substr(n2 + 1, n1 - n2));//截取从?号后面的内容,也就是参数列表，因为传过来的路径是加了码的，所以要解码
  var parameters = parameter.split("&");//从&处拆分，返回字符串数组
  var paValue = new Array();//创建一个用于保存具体值得数组
  for (var i = 0; i < parameters.length; i++) {
    // console.log("参数键值对值"+i+":"+parameters[i]);
    var m1 = parameters[i].length;//获得每个键值对的长度
    var m2 = parameters[i].indexOf("=");//获得每个键值对=号的位置
    var value = parameters[i].substr(m2 + 1, m1 - m2);//获取每个键值对=号后面具体的值
    paValue[i] = value;
    console.log(i + ":" + value);
  }
  console.log(paValue);
  $('#psname').html(paValue[0] + "(" + paValue[2] + "-" + paValue[3] + ")");

  // 先将横坐标置为空，再赋值
  option.xAxis.data = [];
  $.ajax({
    // 服务器地址，发送data再用data.url 去访问解决跨域
    url: url + "/StationRelevanceManage/GetStationTotalDLByYearMonthList",
    type: "POST",
    dataType: "json",
    headers: {
      token: "123"
    },
    data: {
      // url: coupleHelper.url + "/WeiBill/AddRiceLimit",
      year: paValue[2],
      month: paValue[3],
      StationId: paValue[1]
    },
    success: function (resp) {
      if (resp.isSuccess === false) {
        toastr.error("网络慢，请重新加载...")
      } else {
        option.series[0].data = resp.body.totalDlList
        option.series[1].data = resp.body.allFeeList
        for (let i = 1; i <= resp.body.totalDlList.length; i++) {
          option.xAxis.data.push(i + '日')
        }
        console.log(option.xAxis.data)
        myChart.setOption(option);

      }
    },
    error: function (data) {
      toastr.error("抱歉，与服务器连接失败！");
    }
  });

});