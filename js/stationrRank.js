var currentStation = "";
var stationDict = {};
var myChart = echarts.init(document.getElementById('main'));
var nowyear=new Date().getFullYear();
var nowmonth=new Date().getMonth()+1;
$(document).ready(function () {
  DateIn(); //日期控件初始化
  JsonData(); //给电站及年份下拉框赋值
  InitChart();  //初始化图表查询
  CheckInfo();  //点击条件查询图表
  GetRank (nowyear,nowmonth); //初始化排行榜
  CheckRank();  //点击条件查询图表
  GetYesData (); //获取昨日充电排行
});
  //日期控件的初始化
  function DateIn(){
  $('#datachange').datetimepicker({
    format: 'YYYY-MM',
    locale: moment.locale('zh-cn'),
    defaultDate: new Date(),
  }).on('change',function(){
    alert($('#datachange').value())
  })
}

//整合Json数据并赋值给组件
function JsonData () {
  //请求数据给下拉框赋值
  $.ajax({
    type: "POST",
    // url: url + '',
    dataType: "JSON",
    headers: {
   
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

  //给年份下拉框赋值
  var year = new Date().getFullYear();
  var yearhtml = "";
  for (var i = 1; i < 4; i++) {
    yearhtml += '<option value="' + year + '">' + year + '年</option>';
    year--;
  }
  $(".fullYear").append(yearhtml);
}

//初始化图表
function InitChart () {
  var StationId= $(".stationListSelect")[0].value;
  var SearchType= $(".searctype")[0].value;
  var Year=$(".fullYear")[0].value;
  $.ajax({
    type: "POST",
    // url: url + '',
    dataType: "JSON",
    headers: {
      // token: token
    },
    data: {
      StationId:StationId,
      SearchType:SearchType,
      Year:Year
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

//点击请求图表数据
function CheckInfo () {
  $("#checkinfo").on('click', function () {
    InitChart();
  })
}

//初始查询当前月排名
function GetRank(year,month){
    $.ajax({
      type: "POST",
      url: url + "",
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
          var rankPanel = $("#rankList");
          var trtmp = "";
          for (var i = 0; i < list.length; i++) {
            trtmp += ("<tr><td class='stationId'>" + data.id + "</td><td class='station'>" + data[i].name + "</td>" +
              "<td class='power'>" + data[i].power + "</td></tr>");
          }
          rankPanel.html(trtmp);
        }
      },
      error: function (jqXHR) {

      }
    });
 
}

//点击查询当前月排名
function CheckRank(){
  $("#checkrank").on('click',function(){
  // alert($("#datachange")[0].value);
  var thisdate=$("#datachange")[0].value.split("-");
  year=thisdate[0];
  month=thisdate[1];
  GetRank (year,month);
  })
}

//获取昨日充电排行
function GetYesData () {
  $.ajax({
    type: "POST",
    url: baseURL + "/Order/GetOrderAllData",
    data: {
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
        rankYesPanel.html(trtmp);
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