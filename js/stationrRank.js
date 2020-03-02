var currentStation = "";
var stationDict = {};
var myChart = echarts.init(document.getElementById('main'));
$(document).ready(function () {
  JsonData();
  $('#datetimepicker').datetimepicker({
    format: 'YYYY-MM',
    locale: moment.locale('zh-cn'),
    defaultDate: new Date(),
    // onSelect: gotoDate,
  })
  CheckInfo();
  InitChart();
});

//整合Json数据并赋值给组件
function JsonData () {
  //请求数据给下拉框赋值
  $.ajax({
    type: "POST",
    url: url + '',
    dataType: "JSON",
    headers: {
      token: token
    },
    data: {

    },
    success: function (response) {
      if (response.isSuccess) {
        var res = response.body;//接口返回的内容，body里面是请求的内容                    
        if (res.length > 0) {
          var dom = " ";
          for (var i = 0; i < res.length; i++) {
            $(".stationListSelect").append(dom);
            dom += '<option value="' + res[i].stationId + '">' + res[i].stationName + '</option>';
          }
          $(".stationListSelect").append(dom);
        }
      }
      else {
        alert("服务器请求数据失败！");
      }
    },
    error: function () {
      alert("与服务连接失败！");
    }
  })

  // for (index in data.RECORDS) {
  //   var stationMonth = data.RECORDS[index];
  //   var name = stationMonth["电站名称"].replace(/牛牛充电站/gi, "").replace(/\(/gi, "").replace(/\)/gi, "").replace(/（/gi, "").replace(/）/gi, "");
  //   if (name == "测试") continue;
  //   if (name in stationDict) {
  //     stationDict[name].push(stationMonth);
  //   } else {
  //     stationDict[name] = [stationMonth];
  //   }
  //   //{
  //   // "电站名称":"江西科旺科技充电站",
  //   // "总电量":340.43,
  //   // "总费用":503.77,
  //   // "日期":"2019-01"
  //   // },
  // }


  //给电站下拉框赋值
  // for (var index in stationDict) {
  //   $(".stationListSelect").append(dom);
  //   currentStation = index;
  //   var dom = '<option value="#sname#">牛牛充电站#sname#</option>';
  //   dom = dom.replace(/#sname#/gi, index);
  // }
  // ChangeData(currentStation);

  //给年份下拉框赋值
  var year = new Date().getFullYear();
  var yearhtml = "";
  for (var i = 1; i < 4; i++) {
    yearhtml += '<option value="' + year + '">' + year + '年</option>';
    year--;
  }
  $(".fullYear").append(yearhtml);



  //给表格赋值
  var id = 1;
  var rankPanel = $("#rankList");
  var trtmp = "";
  var data_sp = data.RECORDS.splice(0, 10);
  for (i in data_sp) {

  }
  rankPanel.html(trtmp);

  //下拉框Change事件
  // $(".stationListSelect").change(function () {
  //   currentStation = $(this).val();
  //   ChangeData(currentStation);
  // });
}

//请求图表数据
function CheckInfo () {
  $("#checkinfo").on('click', function () {
    InitChart();
  })
}

//初始化图表
function InitChart () {
  $.ajax({
    type: "POST",
    url: url + '',
    dataType: "JSON",
    headers: {
      token: token
    },
    data: {
      StationId: $(".stationListSelect").value(),
      SearchType: $(".searctype").value(),
      Year: $(".fullYear").value()
    },
    success: function (response) {
      if (response.isSuccess) {
        var data = response.body;
        if (data.length == 0) {
          $("#main").css("display", "block");
        }
        else {
          $("#main").css("display", "none");
          var power = Number(data.totalDL.toFixed(2));
          var cost = Number(data.totalMoney.toFixed(2));
          $(".allPower").html(convertToBigString(power));//总电量
          $(".allCost").html(convertMoney(cost, '元', true));//总金额
          // 指定图表的配置项和数据
          var everydate = [];
          var moneyY = [];
          $.each(data, function (index, item) {
            moneyY.push(item.consumePrice.toString());
          });
          var option = {
            title: {
              text: '电站每月电量'
            },
            tooltip: {},
            legend: {
              data: ['电量', '费用']
            },
            xAxis: {
              triggerEvent: true,
              data: []
            },
            yAxis: {
              triggerEvent: true,
              type: 'value',
              name: '单位:kWh'
            },
            series:
              [
                {
                  label: {
                    show: false,
                    position: 'top'
                  },
                  barMaxWidth: 40,
                  name: '电量',
                  type: 'bar',
                  data: moneyY
                }
              ]
          };

          myChart.setOption(option);
          myChart.on('click', function (params) {
            console.log(params.name);
            var stationName = $(".stationListSelect").val();
            var year = $(".fullYear").value();
            var month = params.name;
            location.href = "http://www.ba.com?stationName=" + stationName + "&year=" + year + "&month=" + month;
          });
          window.addEventListener("resize", function () {
            myChart.resize();   //myChart指自己定义的echartsDom对象
          });
          return option;
        }
      }
      else {
        $("#main").css("display", "none");
        alert("数据获取失败")
      }
    },
    error: function () {
      alert("服务器连接失败")
    }
  })
}

//给时间选择器赋值并查询排名
function GetRank () {


}

//获取昨日充电排行
function GetYesData () {
  $.ajax({
    type: "POST",
    url: baseURL + "/Order/GetOrderAllData",
    data: {
      Year: year,
      Month: month
    },
    dataType: "json",
    beforeSend: function (request) {
      request.setRequestHeader("token", token);
    },
    success: function (response) {
      if (response.isSuccess) {
        var list = response.body.list;
        if (list.length > 0) that.orderTableData = list;
        var rankYesPanel = $("#rankYesList");
        var trtmp = "";
        for (var i = 0; i < list.length; i++) {
          trtmp += ("<tr><td class='stationId'>" + data.id + "</td><td class='station'>" + data[i].name + "</td>" +
            "<td class='power'>" + data[i].power + "</td></tr>");
        }
        rankPanel.html(trtmp);
      }
      else {

      }
    },
    error: function (jqXHR) {

    }
  });

}

//图表数据变化
// function ChangeData (index) {
//   var op = InitChart();
//   var totalDL = 0;
//   var totalMoney = 0;
//   var data_2 = stationDict[index];
//   op.xAxis.data = [];
//   op.series[0].data = [];
//   // option.series[1].data=[];
//   for (var thisIndex in data_2) {
//     var thisData = data_2[thisIndex];
//     op.xAxis.data.push(thisData["日期"]);
//     op.series[0].data.push(thisData["总电量"]);
//     totalDL += thisData["总电量"];
//     totalMoney += thisData["总费用"];
//     // option.series[1].data.push(thisData["总费用"]);
//   }


//   myChart.setOption(op);
// }



//单位转换
function convertToBigString (val) {
  if (val > 1000 * 1000 * 10) {
    return (val / (1000 * 1000)).toFixed(2) + 'GWh';
  }
  if (val > 1000 * 10) {
    return (val / 1000).toFixed(2) + 'MWh';
  }
  return (val).toFixed(2) + 'KWh';
}

function convertMoney (val, preix, isRemain) {
  if (val > 10000 * 1000) {

    if (isRemain) {
      return (val / (10000 * 1000)).toFixed(2) + '千万元';
    }
    return (val / (10000 * 1000)).toFixed(0) + '千万元';
  }
  if (val > 10000 * 10) {
    if (isRemain) {
      return (val / 10000).toFixed(2) + '万元';
    }
    return (val / 10000).toFixed(0) + '万元';
  }
  if (isRemain) {
    return (val).toFixed(2) + preix;
  }
  return (val).toFixed(0) + preix;
}