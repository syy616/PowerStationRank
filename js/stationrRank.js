var myChart = echarts.init(document.getElementById('main'));
var nowyear = new Date().getFullYear();
var nowmonth = new Date().getMonth() + 1;
var url = "http://192.168.1.181:7878";
$(document).ready(function () {
  $("#main").css("display", "none");  //图表先隐藏，请求成功再show
  $('#searctype').selectpicker('refresh');   //使用refresh方法更新UI以匹配新状态。
  document.getElementById("searctype").options.selectedIndex = 0; //默认让类型选择框选择第一个，适用于回退重新赋值
  $('#searctype').selectpicker('render');   //render方法强制重新渲染引导程序 - 选择ui。
  DateIn(); //日期控件初始化
  toar();   //提示框控件初始化
  ChangeYear();//年份赋值
  GetStation(); //给可搜索电站下拉框赋值
  ChangeStation(); //根据类型切换电站
  CheckInfo();  //点击条件查询图表
  GetRank(nowyear, nowmonth, 1); //初始化排行榜
  CheckRank();  //点击条件查询图表
  GetYesData(); //获取昨日充电排行
});

//日期控件的初始化
function DateIn () {
  $('#datachange').datetimepicker({
    format: 'YYYY-MM',
    locale: moment.locale('zh-cn'),
    defaultDate: new Date(),
  })
}

//弹出框插件初始化
function toar () {
  toastr.options = {
    closeButton: false,                                            // 是否显示关闭按钮，（提示框右上角关闭按钮）
    debug: false,                                                    // 是否使用deBug模式
    progressBar: true,                                            // 是否显示进度条，（设置关闭的超时时间进度条）
    positionClass: "toast-top-center",              // 设置提示款显示的位置
    onclick: null,                                                     // 点击消息框自定义事件 
    showDuration: "300",                                      // 显示动画的时间
    hideDuration: "1000",                                     //  消失的动画时间
    timeOut: "2000",                                             //  自动关闭超时时间 
    extendedTimeOut: "1000",                             //  加长展示时间
    showEasing: "swing",                                     //  显示时的动画缓冲方式
    hideEasing: "linear",                                       //   消失时的动画缓冲方式
    showMethod: "fadeIn",                                   //   显示时的动画方式
    hideMethod: "fadeOut"                                   //   消失时的动画方式
  };
}

//年份赋值
function ChangeYear () {
  var year = new Date().getFullYear();
  var yearhtml = "";
  for (var i = 1; i < 4; i++) {
    yearhtml += '<option value="' + year + '">' + year + '年</option>';
    year--;
  }
  $(".fullYear").append(yearhtml);
}

//根据类型请求电站赋值给组件
function GetStation () {
  //请求数据给电站下拉框赋值
  var type = $("#searctype")[0].value;
  $.ajax({
    type: "POST",
    url: url + '/StationRelevanceManage/GetStationListData',
    dataType: "json",
    headers: {
      token: "123"
    },
    data: {
      type: type
    },
    success: function (response) {
      if (response.isSuccess) {
        var res = response.body;//接口返回的内容，body里面是请求的内容                            
        if (res.length > 0) {
          $("#stationListSelect").empty();
          var dom = " ";
          for (var i = 0; i < res.length; i++) {
            dom += '<option value="' + res[i].indexId + '">' + res[i].stationName + '</option>';
          }
          $("#stationListSelect").append(dom);
          //使用refresh方法更新UI以匹配新状态。
          $('#stationListSelect').selectpicker('refresh');
          //render方法强制重新渲染引导程序 - 选择ui。
          $('#stationListSelect').selectpicker('render');
        }
        GetTotalDl();
        InitChart();  //初始化图表查询
      }
      else {
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function () {
      toastr.error("抱歉，与服务器连接失败！");
    }
  })

}

//点击按钮切换电站
function ChangeStation () {
  $("#searctype").on('changed.bs.select', function (e) {
    GetStation();
  })
  //点击电站自动show柱状图
  // $("#stationListSelect").on('changed.bs.select', function (e) {
  //   GetTotalDl();
  //   InitChart();
  // })
}

//根据电站Id获取总电量和总金额
function GetTotalDl () {
  var StationId = $("#stationListSelect")[0].value;
  var year = $(".fullYear")[0].value;
  $.ajax({
    type: "POST",
    url: url + '/StationRelevanceManage/GetStationTotalDLByYearStationIdResult',
    dataType: "json",
    headers: {
      token: "123"
    },
    data: {
      StationId: StationId,
      year: year
    },
    success: function (response) {
      if (response.isSuccess) {
        var res = response.body;//接口返回的内容，body里面是请求的内容          
        var power = Number(res.totalDL.toFixed(2));
        var cost = Number(res.allFee.toFixed(2));
        $(".allPower").val(convertToBigString(power));//总电量
        $(".allCost").val(convertMoney(cost, ' 元', true));//总金额                  
      }
      else {
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function () {
      toastr.error("抱歉，与服务器连接失败！");
    }
  })
}

//初始化图表
function InitChart () {
  var StationId = $("#stationListSelect")[0].value;
  var Year = $(".fullYear")[0].value;
  $.ajax({
    type: "POST",
    url: url + '/StationRelevanceManage/GetStationMonthTotalDLByYearList',
    dataType: "json",
    headers: {
      token: "123"
    },
    data: {
      StationId: StationId,
      Year: Year
    },
    success: function (response) {
      if (response.isSuccess) {
        var data = response.body;
        if (data.length == 0) {
          $("#main").css("display", "none");
        }
        else {
          $("#main").css("display", "block");
          var list = data.totalDlList;
          var everydate = [];
          var PowerY = [];
          var sbtitle = $("#stationListSelect").next('button')[0].title
          for (var m = 0; m < list.length; m++) {
            everydate.push(list[m].monthNum);
            PowerY.push(list[m].totalDL);
          }
          var option = {
            title: {
              text: '电站每月电量',
              subtext: sbtitle,
              padding: [30, 20, 10, 25],
              margin: 10,
              subtextStyle: {
                color: '#666',
                fontWeight: "bold",
                fontSize: "15"
              }
            },
            // toolbox: {
            //   feature: {
            //     saveAsImage: {}
            //   }
            // },
            grid: {
              top: '25%',
              left: '12%'
            },
            tooltip: {
              show: true,
              confine: true, //将提示框放在图表内
              formatter: '日期:{b} 月<br/>充电电量:{c} kWh',
            },
            legend: {
              data: ['电量']
            },
            xAxis: {
              name: '月份',
              data: everydate,
              nameTextStyle: {
                padding: [0, 0, 0, -5]
              }
            },
            yAxis: {

              type: 'value',
              name: 'kWh',
              axisLabel: {
                //            	inside:true
                rotate: 45
              },
              splitLine: {
                lineStyle: {
                  color: 'rgb(34,57,91)'
                }
              }
            },
            series:
              [
                {
                  label: {
                    show: true,
                    position: 'top',
                    color: '#666'
                  },
                  itemStyle: {
                    color: '#5bc0de',
                    opacity: 8
                  },
                  barMaxWidth: 40,
                  name: '电量',
                  type: 'bar',
                  data: PowerY,
                  markLine: {
                    lineStyle: {
                      normal: {
                        color: '#000000',
                        width: 5
                      }
                    }
                  }
                }
              ]
          };

          
          myChart.setOption(option);
          myChart.on('click', function (params) {
            console.log(params.name);
            var StationId = $("#stationListSelect").val();
            var StationName = $("#stationListSelect").next('button')[0].title;
            var year = $(".fullYear").val();
            var month = params.name;
            location.href = "./everydetails.html?StationName=" + StationName + "&StationId=" + StationId + "&year=" + year + "&month=" + month;
          });
          window.addEventListener("resize", function () {
            myChart.resize();   //myChart指自己定义的echartsDom对象
          });
          return option;
        }
      }
      else {
        $("#main").css("display", "none");
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function () {
      toastr.error("抱歉，与服务器连接失败！");
    }
  })
}

//点击按钮请求图表数据
function CheckInfo () {
  $("#checkinfo").on('click', function () {
    InitChart();
    GetTotalDl();
  })
}

//初始查询当前月排名
function GetRank (year, month, type) {
  var rankPanel = $("#rankList");
  var trtmp = "";
  $.ajax({
    type: "POST",
    url: url + "/StationRelevanceManage/GetAllStationTotalDByYearMonthList",
    data: {
      pageIndex: 1,
      pageCount: 10,
      year: year,
      Month: month,
      Type: type
    },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        var list = response.body.list;
        if (list.length > 0) {
          for (var i = 0; i < list.length; i++) {
            trtmp += ("<tr><td class='stationId'>" + Number(i + 1) + "</td><td class='station'>" + list[i].stationName + "</td>" +
              "<td class='power'>" + convertToBigString(list[i].totalDL) + "</td></tr>");
          }
          rankPanel.html(trtmp);
        }
        else {
          trtmp = ("<tr><td class='stationId'></td><td class='station'>暂无该月数据~</td><td class='power'></td></tr>")
          rankPanel.html(trtmp);
          toastr.warning("该月充电排行没有数据~");
        }
      }
      else {
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function (jqXHR) {
      trtmp = ("<tr><td class='stationId'></td><td class='station'>暂无当月数据~</td><td class='power'></td></tr>")
      rankPanel.html(trtmp);
      toastr.error("抱歉，与服务器连接失败！");
    }
  });

}

//点击查询当前月排名
function CheckRank () {
  $("#checkrank").on('click', function () {
    // alert($("#datachange")[0].value);
    var thisdate = $("#datachange")[0].value.split("-"),
      year = thisdate[0],
      month = thisdate[1],
      type = $(".searctype2")[0].value;
    GetRank(year, month, type);
  })
}

//获取昨日充电排行
function GetYesData () {
  var type = $(".searctype2")[0].value;
  var rankYesPanel = $("#rankYesList");
  var trtmp = "";
  $.ajax({
    type: "POST",
    url: url + "/StationRelevanceManage/GetAllStationTotalDByYesterdayList",
    data: {
      pageIndex: 1,
      pageCount: 10,
      Type: type
    },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        var list = response.body.list;
        if (list.length > 0) {
          for (var i = 0; i < list.length; i++) {
            trtmp += ("<tr><td class='stationId'>" + Number(i + 1) + "</td><td class='station'>" + list[i].stationName + "</td>" +
              "<td class='power'>" + convertToBigString(list[i].totalDL) + "</td></tr>");
          }
          rankYesPanel.html(trtmp);
        }
        else {
          trtmp = ("<tr><td class='stationId'></td><td class='station'>暂无昨日数据~</td><td class='power'></td></tr>")
          rankYesPanel.html(trtmp);
          toastr.warning("昨日充电排行没有数据~");
        }
      }
      else {
        toastr.error("抱歉，与服务器连接失败！");
      }
    },
    error: function (jqXHR) {
      trtmp = ("<tr><td class='stationId'></td><td class='station'>暂无昨日数据~</td><td class='power'></td></tr>")
      rankYesPanel.html(trtmp);
      toastr.error("抱歉，与服务器连接失败！");
    }
  });

}

//电量单位转换
function convertToBigString (val) {
  if (val > 1000 * 1000 * 10) {
    return (val / (1000 * 1000)).toFixed(2) + ' GWh';
  }
  if (val > 1000 * 10) {
    return (val / 1000).toFixed(2) + ' MWh';
  }
  return (val).toFixed(2) + ' KWh';
}

//金钱单位转换
function convertMoney (val, preix, isRemain) {
  if (val > 10000 * 1000) {

    if (isRemain) {
      return (val / (10000 * 1000)).toFixed(2) + ' 千万元';
    }
    return (val / (10000 * 1000)).toFixed(0) + ' 千万元';
  }
  if (val > 10000 * 10) {
    if (isRemain) {
      return (val / 10000).toFixed(2) + ' 万元';
    }
    return (val / 10000).toFixed(0) + ' 万元';
  }
  if (isRemain) {
    return (val).toFixed(2) + preix;
  }
  return (val).toFixed(0) + preix;
}