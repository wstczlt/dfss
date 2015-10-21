	/**
	 * 学习页面相关业务操作
	 * 1、加载课程树；
	 * 2、进行mp4或者swf课件的播放（全屏，上一页，下一页，重播，点击小圆点播放，进度条加载等）；
	 * 3、播放完成后进行保存学时操作；
	 * 4、进行验证下一步进行的操作：alert，push，js，exam，人脸识别等；
	 * 5、学习页面的测试课部分；
	 * 6、学习页面的考试部分；
	 */
	//课程树对象
	var zTreeObj;
	//最后学习的课程文件
	var lastSwfFile = "";
	//学习的课件数目
	var lastWareSum = "";
	//学习的当前课件下标
	var lastWareNum = "";
	//要播放的当前章节id
	var chapterId;
	//要播放的当前课件id
	var wareId;
	var chapterWareId;
	//对play做控制
	var chapterPlay = true;
	//课件or考题信息
	var testWare;
	//记录当前播放课件
	var curNode;
	//当前播放课件的前一个有效课件
	var preNode;
	var preChapterId;
	// 当前播放课件的下一个有效课件
	var nxtNode;
	var nxtChapterId;
	//是否对下步做控制
	var nextplay;
	//当前播放的课程的id
	var curCourseId;
	//课件数量
	var wareSum;
	//课件下标
	var wareNum;
	//是否连续播放
	var mode;
	//是否播放的是第一个课件
	var firstWareMark=0;
	//是否已经在进行处理
	var isHandle=false;
	//是否进行过人脸识别且通过了
	var facesPass=1;
	
	//记录考题集合
    var examIds;
	 //记录测试map
    var examMap=new Map();
    //记录正确选项测试map
	var examOkMap=new Map();
    //记录当前测试课课程ID
    var chapterExamId;
	//记录多选正确选项
	var okCheckExam = "";
	//考题集合数量
	var examArray;
	// 加载进度条时间
	var updateTime;
	// 选择的章节节点
	var selectingNode;
	// 保利威视 验证码
	var verificationcode;
	// 视频对应的保利威视id
	var polyvId;
	// 调整视频大小定时器 
	var adjustVideoSizeTimer1;
	// 试题是否选择正确
	var examCorrectFlag = false;
	// 上一个可学节点
	var lastAvalibleNode;
	// 点击链接当前时间
	var clickTime = new Date().getTime()-3000;
	// 题目、选项是否分时展现    0:正常显示；1：分时显示
	var showExamTime = "0";

	var thirdWebSite = "/";
	//当前学时
	var sumStudyTime;
	//总学时
	var targetStudyTime;
	// 计划中课件总数量
	var wareCount;
	// 已学计划课件数量
	var studyCount;
	
	swfobject.registerObject("swfPlayers", "9.0.0");
	
	//swf 播放器参数
	var params = {
		allowscriptaccess :"always",
		allownetworking:"all" ,
		allowfullscreen:"true",
		wmode:"transparent",
		quality:"high",
		menu:"false"
	};
	
	var attributes = {
		id: "swfPlayers",
		name: "swfPlayers"
	};
	
	//CC播放器相关
	var ccCode = "";
    var _playStatus = "";
	
	/**
	 *课程树显示设置相应的属性
	 */
	var setting = {
		view: {selectedMulti: false,showIcon: showIconForTree,dblClickExpand: false,showLine: false,nameIsHTML: true},
		check:{enable: false},
		data: {simpleData: {enable: true},key: {title:"t"}},
		callback:{onClick:changeTreeModel}
	};
	
	function showIconForTree(treeId, treeNode) {
		return !treeNode.isParent;
	};

	/**
	 * 点击某一个课程结点，展开/折叠父节点。
	 * 如果点击的是叶子节点在进行播放操作，获取播放信息
	 */
	function changeTreeModel(e,treeId, treeNode){
		chapterWareId = "";
		var nodes = zTreeObj.getSelectedNodes();
		selectingNode = nodes[0];
		if (treeNode.isParent) {
			zTreeObj.expandNode(treeNode);
		} else {
			 if(new Date().getTime()-clickTime < 3000) {
				 return;
			 }
			 clickTime = new Date().getTime();	// 记录当前时间
	         var isLearnedFlag = false;
	         var url = contextPath+"/web/player!judgeClickChapterIsLearned.do?"+
	         	"curCourseId="+nodes[0].courseId+"&chapterIds="+nodes[0].id;
	         myLandAjaxJson(url, "", function(code, ajaxPara) {
	        	 var temp = eval("("+ajaxPara+")");
	        	 if(temp.code == "00") {
	        		 isLearnedFlag = true;
	        	 } else if(temp.code == "11") {
	        		 isLearnedFlag = false;
	        		 mylandAlert("信息提示",temp.message);
	        	 } else { // 02提示未登录或session失效
	        		 isLearnedFlag = false;
	        		 mylandConfirmByFunc("信息提示", temp.message, function(){
	        			 window.top.location.href = thirdWebSite;
	        			 return true;
	        		 }, null, "确定", null);
	        		 return ;
	        	 }
	         });
	         if(isLearnedFlag) {
	        	 player_mp4(nodes[0].id,nodes[0].courseId);
	         } else {
	        	 if(lastAvalibleNode != null) {
	        		 zTreeObj.selectNode(lastAvalibleNode);
	        	 }
	         }
		}
	}
	
	/**
	 * 验证ocx是否加载完成
	 */
	function checkOcx(){
     	var ocxStatus = "";
     	try{
         	ocxStatus = ocx.GetStatus();
         	if (ocxStatus == "-9" || ocx.GetAddPort() == "53") {
         		mylandConfirmByFunc("信息提示", "不允许一机多学！",
    				function() {
    					window.document.location = "/";
    					return true;
    				}
        		);
         		return;
         	}
        }catch(e){
        	mylandConfirmByFunc("安装学习辅助工具提示",
				"为保证您顺利学习课程，请安装来自“北京通安信息技术有限公司”的“在线学习辅助工具”，</br></br>"+
				"安装完成后，请刷新当前页面，即可正常学习，否则请重启浏览器（请使用IE浏览器）。 <a href='/jpv2/ocxFolder/bjta.exe'>下载控件</a>",
				function() {
					window.document.location.reload();
					return true;
				}
    		);
         	return;
        }
        //引入ocx
        /*ocx.SetServerCode("<myland:dic code='system_info' name='server_code' value=''/>");//设置设备码
        ocx.SetLoginId("${sessionScope.person.id}");//设置学员id
        ocx.SetACAdd("<myland:dic code='system_info' name='ac_url' value=''/>");//设置ac地址
        ocx.SetFileServerAdd("<myland:dic code='system_info' name='file_address' value=''/>");//设置文件服务器地址
        */
        ocx.SetSessionId("${pageContext.session.id}");//sessionId   
        
     	if (ocxStatus != "00"){	
     		setTimeout("checkOcx()",1000);
     	}else{
     		zTreeObj = $.fn.zTree.init($("#courseTree"), setting, treeJsons);
     		if(faceTypes != 0){
     			checkFaceVerify(faceTypes);
     		}else{
     			//获取下一步操作
     			checkNextNode();
     		}
     	}
     }
	
	/**
	 * 验证初始进入页面时是否进行人脸识别---初始进入页面。刷新页面
	 * @param faceTypes
	 */
	function checkFaceVerify(faceTypes){
		if(faceTypes != 0){
			facesPass = 0;
        	if(faceTypes == '1'){//检测
        		fees('1');
        		return;
        	} else if (faceTypes == '2'||faceTypes=='3'){//识别
        		fees('2');
        		return;
        	} else if (faceTypes == '4'){	// 内网检测人脸
        		fees('4');
        		return;
        	} else if (faceTypes == '5'){	// 采集验证（无框）
        		fees('5');
        		return;
        	}
        }
	}
	
	/**
	 * 验证下一步操作
	 */
	function checkNextNode(){
		var date = new Date().getTime();
		myLandAjaxJson(contextPath+"/web/player!asynCurPlayNode.do?time="+date,"",playNodeCallback);
	}
	/**
	 * 验证下一步进行的操作的回调函数
	 * @param code
	 * @param ajaxPara
	 */
	function playNodeCallback(code,ajaxPara){
		if("00"==code){
			var temp = eval("("+ajaxPara+")");
			if(temp.code=="00"){
				var checkInfo = temp.message;
				if(checkInfo!=''&&checkInfo!=null&&checkInfo!='null'&&checkInfo!='undefined'){
					var info = eval("("+checkInfo+")");
					var infoCode = info.code;
					if(infoCode =='10'){
						var lastChapterId1 = info.lastChapterId;
						var lastWareId = info.lastWareId;
						if(lastWareId != null && lastWareId != "" && lastWareId != 0) {
							chapterWareId = lastWareId;
						}
						selectingNode = zTreeObj.getNodeByParam("id",lastChapterId1, null);
						player_mp4(lastChapterId1,selectingNode.courseId);
						return;
					}else{
						 var nodes = zTreeObj.transformToArray(zTreeObj.getNodes());
					      if (nodes.length>3) {
					          zTreeObj.selectNode(nodes[3]);
					      }
					      if(infoCode =='11'){//alert弹框提示
								var alertInfo = info.text;
								//做后续工作
								mylandAlert("信息提示",alertInfo);
								//调用后台修改到下一个结点--personPlan--lashPlanNode
								modifyNextMode();
								return;
							}else if(infoCode =='12'){//调用js
								/*var jsMethod = info.jsMethod;
								getMethodName(jsMethod);*/
								jsMethod(info);
								//调用后台修改到下一个结点--personPlan--lashPlanNode
								//modifyNextMode();
								return;
							}else if(infoCode =='13'){//人脸识别
								if(faceTypes != 0){
					     			checkFaceVerify(faceTypes);
					     		}
								modifyNextMode();
								//做后续工作
								return;
							}else if(infoCode =='14'){//推送学时
								//此处省略推送学时
								//调用后台修改到下一个结点--personPlan--lashPlanNode
								var checkInfo = temp.message;
								//mylandAlert("信息提示","推送学时成功");
								/*var date = new Date().getTime();
								var url = contextPath+"/web/player!pushLearnTime.do?date"+date;
								myLandAjaxJson(url, "", callBackPushFun);
*/								modifyNextMode();
								return;
							}else if(infoCode =='15'){//考试
								var testPaperId = info.testPaperId
								var examScore = info.score;//考试分数
								var examCount = info.count;//考试次数
								var examType = "1";//考试类型：1---学习时候的考试
								//做后续工作
								var data = "examScore="+examScore+"&examCount="+examCount+"&examType="+examType+"&testPaperId="+testPaperId;
								var url = contextPath+"/web/personExam!startTestPaper.do?"+data;
								myLandAjax(url,"","html",examNodeCallback);
								return;
							}else if(infoCode =='20'){
								var node_code = info.node_code;
								if("ALERT" == node_code) {
									var node_option_msg = eval("("+info.node_option+")");
									var node_option = node_option_msg.text;
									mylandConfirmByFunc("信息提示", node_option, 
										function () {
											// 播放第一个可播放的节点
											var nodes = zTreeObj.getNodes();
											if (nodes.length > 0) {
												var node = nodes[0];
												while(node.children != null) {
													node = node.children[0];
												}
												zTreeObj.selectNode(node);
												changeTreeModel(null,null,node);
											}											
										}
									);
								} else {
									// 播放第一个可播放的节点
									var nodes = zTreeObj.getNodes();
									if (nodes.length > 0) {
										var node = nodes[0];
										while(node.children != null) {
											node = node.children[0];
										}
										zTreeObj.selectNode(node);
										changeTreeModel(null,null,node);
									}
								}
							} else {
								return;
							}
						} 
					} else {
						mylandAlert("信息提示", "播放完成（或获取播放信息出现错误）！");
					}
			}else{
				$("#nextPlayButton").attr("onclick","noDecide()");
				mylandAlert("信息提示",temp.message);
			}
		}else{
			mylandAlert("信息提示",ajaxPara);
		}
	}
	function noDecide(){
		mylandAlert("信息提示","保存信息失败，请重新学习本章节!");
	}
	/**
	 * 调用后台修改到下一个结点
	 * personPlan--lashPlanNode
	 */
	function modifyNextMode(){
		var date = new Date().getTime();
		var url = contextPath+"/web/personStudy!modifyPersonNode.do?date"+date;
		myLandAjaxJson(url,"",modifyNextModeCallback);
	}
	/**
	 * 修改最后学习结点回调函数
	 */
	function modifyNextModeCallback(code,ajaxPara){
		if("00"==code){
			var temp = eval("("+ajaxPara+")");
			if(temp.code=="00"){
				//判断验证下一步操作
				checkNextNode();
			}else{
				mylandAlert("信息提示",temp.message);
			}
		}else{
			mylandAlert("信息提示",ajaxPara);
		}
	}
	var i=0;
	function callBackPushFun(code,ajaxPara){
		if("00"==code){
			var temp = eval("("+ajaxPara+")");
			
			if(temp.code=="00"){
				//判断验证下一步操作
			//	alert(temp.code+" and I"+i+temp.message);
				modifyNextMode();
				//checkNextNode();
			}else{
				mylandAlert("信息提示",temp.message);
			}
		}else{
			mylandAlert("信息提示",ajaxPara);
		}
	}
	 /**
     * 学习时考试逻辑--回调函数
     */
    function examNodeCallback(code,ajaxPara){
	   	if(code=="00"){
	   		$("#title").hide();
	   		$("#play").hide();
	   		// 课件中，停止上一mp4视频的运行
        	var mp4PlayerDiv = document.getElementById("mp4Player");
        	if(mp4PlayerDiv != null) {
        		if(typeof(mp4Players) != "undefined" && typeof(mp4Players) == "object") {
        			if(mp4Players.controls != null) {
        				mp4Players.controls.stop();
        			}
        		}
        	}
        	// 课件中，停止上一cc视频的运行
        	var ccPlayerDiv = document.getElementById("ccPlayerDiv");
        	if(ccPlayerDiv != null) {
        		if(typeof(ccplayer) != "undefined" && ccplayer != null) {
        			ccplayer.pause();
        		}
        	}
        	// 测试课中，停止并移除视频
        	var showMp4Div = document.getElementById("showMp4Div");
    		if(showMp4Div != null) {
    			videoObject.controls.stop();
    			$("#showMp4Div").remove();
    		}
	   		$("#show").replaceWith(ajaxPara);
	   	}else{
	   		mylandAlert("信息提示",ajaxPara);
	   	}
    }
    
    
     /**
     * 暂停播放
     */
    function pauser1(){
    	if(mp4Players != null) {
        	var state=mp4Players.playState;
        	// 播放状态，暂停
        	if(state==3){
        		mp4Players.controls.pause();
        		// 播放图像中的按钮
        		$("#playBtn").css({display:"block"});
        		// 控制按钮
        		$("#pauseBtnDiv").css({display:"none"});
        		$("#playBtnDiv").css({display:"block"});
        	}
        	// 暂停状态，播放
        	if(state==2){
        		mp4Players.controls.play();
        		// 播放图像中的按钮
        		$("#playBtn").css({display:"none"});
        		// 控制按钮
        		$("#pauseBtnDiv").css({display:"block"});
        		$("#playBtnDiv").css({display:"none"});
        	}
    	}
    }
    /**
     * 全屏播放
     */
    function fullScreen1(){
    	var state=mp4Players.playState;
    	if(state==3){
    		mp4Players.fullScreen=true;
    	}
    	
    }
	/**
	 *获取播放信息，进行播放
	 */
	function player_mp4(tempChapterId,tempCourseId){
		if("1" == importOcx) {
			//获取控件ocx加载状态，若未加载完成给予提示
	        var ocxStatus = "";
	        try{
	        	ocxStatus = ocx.GetStatus();
	        }catch(e){
	        	showPrompt("请先安装控件。");
	        }
	        if (ocx.GetAddPort()=="53"){
	    		mylandAlert("信息提示","端口冲突， 请不要一机多学，可检查端口或者联系客服！");
	    		window.location.href=contextPath+"web/index.do";
	    		return;
	    	}
		}
		//验证当前节点是否可学，防止用户乱点
        if (!chapterPlay){
        	document.getElementById('load').style.display = 'block';
            return;
        }else{
        	chapterPlay = false;
        }
        if(chapterWareId != null && chapterWareId != "" && chapterWareId != 0) {
        	firstWareMark = 1;
        }
        if (firstWareMark == 0){
        	chapterWareId = "";
        }else{
        	firstWareMark = 0;
        }
        if(chapterWareId=="-1"){
        	chapterWareId="";
        }
		chapterId = tempChapterId;
		curCourseId = tempCourseId;
        var cjtime = new Date().getTime();
		var data = 'chapterIds=' + tempChapterId + '&chapterWareId=' + chapterWareId + '&curCourseId='+curCourseId+'&cj=' + cjtime + '&handleType=0';
		var url = contextPath+"/web/player!treePlayHandle.do?"+data;
		myLandAjaxJson(url,"",handleBack);
	}
	
	/**
	 * 播放回调函数
	 * @param code
	 * @param ajaxPara
	 */
	function handleBack(code,ajaxPara){
		if("00"==code){
			var temp = eval("("+ajaxPara+")");
			if(temp.code=="00"){
				$("#title").show();
	   		    $("#play").show();
	   		    $("#show").empty();
	   		    $("#show").hide();
	   		    lastAvalibleNode = selectingNode;	// 上一个可学的节点
				
				//开启定时任务保持session
				flushSessionIntervalFunc();
				var playInfoJson ;
				try{
					playInfoJson = eval("("+temp.message+")");
				}catch(e){
					mylandAlert("信息提示","返回信息异常!");
					return ;
				}
				//当前学时
				sumStudyTime = playInfoJson.sumStudyTime;
				//总学时
				targetStudyTime = playInfoJson.targetStudyTime;
				// 总课件
				wareCount = playInfoJson.wareCount;
				// 已学课件
				studyCount = playInfoJson.studyCount;
                //课件or考题信息
                testWare = playInfoJson.ware;
                //进度
                var rate = playInfoJson.rate;
                //记录当前播放课件
                curNode = playInfoJson.curWare;
                //当前播放课件的前一个有效课件
                preNode = playInfoJson.preWare;
                preChapterId = playInfoJson.preChapter;
                // 当前播放课件的下一个有效课件
                nxtNode = playInfoJson.nxtWare;
                nxtChapterId = playInfoJson.nxtChapter;
                //是否对下步做控制
                nextplay = playInfoJson.nextplay;
                //更新当前学时
                $("#currentRate").html(sumStudyTime+"/"+targetStudyTime);
                $("#prograss").css("width",rate+"%");
                $("#rate").html(rate+"%");
                if(!nextplay){
                	$("#showNextWare").html("<img src=\""+contextPath+"/images/webcustomer/learnPag/z2.gif\"/>");
                }else{
                	//显示下一步
    				$("#showNextWare").html("<a href=\"javascript:showNext();\"><img src=\""+contextPath+"/images/webcustomer/learnPag/z1.gif\"/></a>");
                }
                //课件数量
                wareSum = playInfoJson.sum;
                //课件下标
                wareNum = playInfoJson.num;
                //是否连续播放
                mode = playInfoJson.mode;
                //标题
                var wareDesc = playInfoJson.wareDesc;
                // 视频播放方式
                var playerType = playInfoJson.playerType;
                // cc对应视频标志
                var fileNameCc = playInfoJson.fileNameCc;
                // 视频对应的保利威视id
                polyvId = playInfoJson.polyvId;
                // 当前课件的id
                wareId = playInfoJson.wareId;
                
                ccCode = playInfoJson.ccCode;
                verificationcode = playInfoJson.verificationcode;
                
                zTreeObj.selectNode(selectingNode);
                
                changCurStyleAndPlay(testWare, wareDesc, wareSum, wareNum, playerType, fileNameCc);
			}else{
				var tempCode = temp.code;
				if(tempCode =='101'){//重新登录
					mylandAlert("信息提示",temp.message);
					return;
				}else if(tempCode =='102'){//刷新页面重试
					mylandAlert("信息提示",temp.message);
					return;
				}else if(tempCode == '103'){//按照顺序学习
					var jsonInfo = eval("("+temp.message+")");
					var errorInfo = jsonInfo.info;
					mylandAlert("信息提示",errorInfo);
					chapterPlay = true;
					return;
				}else if(tempCode == '104'){//人脸识别
					var typeInfo = eval("("+temp.message+")");
					var faceTypeCode = typeInfo.faceType;
					if(faceTypeCode == '101'){//检测不识别
						fees('1');
					}else if(faceTypeCode == '102'){//检测识别
						if(isFirstComing==1){//首次--识别
							fees('2');
						}else{//其他情况下检测采集
							fees('1');
						}
					}else if(faceTypeCode == '103'){//识别
						fees('2');
					}else if(faceTypeCode == '104'){ //内网采集
						fees('4');
					}else if(faceTypeCode == '105'){ //采集验证（无红框 ）
						fees('5');
					}
				}
			}
		}else{
			mylandAlert("信息提示",ajaxPara);
		}
	}

	/**
	 * 课程标题显示
	 */
	var changCurStyleAndPlay = function(playFile, wareDesc, wareSum, wareNum, playerType, fileNameCc){
		//改变播放标题信息
        var chapterTitle = wareDesc.split(",");
        //如果标题大于等于5级,去除前两级
        if(chapterTitle.length >= 5){
        	chapterTitle.splice(0, 2);
        }
        if (chapterTitle[0].length >= 30){
        	$("#ti1").html(chapterTitle[0].substring(0, 28) + "...") ;
        }else{
        	$("#ti1").html(chapterTitle[0]);
        }
		var title = chapterTitle[0]+ chapterTitle[1];
        if (title.length > 40){ 
        	$("#ti1_1").html("&nbsp;&nbsp;&nbsp;&nbsp;" + chapterTitle[1].substring(0, 10) + "...");
        }else{
        	if(null == chapterTitle[1]){
        		chapterTitle[1]="";
        	}
        	$("#ti1_1").html("&nbsp;&nbsp;&nbsp;&nbsp;" + chapterTitle[1]);
        }
        if (chapterTitle.length > 2){
        	$("#ti2").html("");
            for (var i = 2; i < chapterTitle.length; i++){
                if (chapterTitle[i].length > 30){
                	$("#ti2").html($("#ti2").html()+"&nbsp;&nbsp;&nbsp;&nbsp;" + chapterTitle[i].substring(0, 28) + "...");
                } else {
                	$("#ti2").html($("#ti2").html()+"&nbsp;&nbsp;&nbsp;&nbsp;" + chapterTitle[i]);
                }
            }
        } else {
        	$("#ti2").html("");
        }
        callPlayer(playFile, wareSum, wareNum, playerType, fileNameCc);
    }

    /**
     * 播放/考试控制
     * @param filePath
     * @param wareSum
     * @param wareNum
     */
    function callPlayer(filePath, wareSum, wareNum, playerType, fileNameCc){
    	// 停止定时器
    	window.clearInterval(updateTime);
    	window.clearInterval(adjustVideoSizeTimer1);
        var testOrWare = filePath.split("|");
        if(1==facesPass){
        	// 课件中，停止上一mp4视频的运行
        	var mp4PlayerDiv = document.getElementById("mp4Player");
        	if(mp4PlayerDiv != null) {
        		if(typeof(mp4Players) != "undefined" && typeof(mp4Players) == "object") {
        			if(mp4Players.controls != null) {
        				mp4Players.controls.stop();
        			} else {
        				mylandAlert("信息提示","请启用 Windows Media Player 功能。");
        			}
        			$("#mp4Player").empty();
        		}
        	}
        	// 课件中，停止上一cc视频的运行
        	var ccPlayerDiv = document.getElementById("ccPlayerDiv");
        	if(ccPlayerDiv != null) {
        		if(typeof(ccplayer) != "undefined" && ccplayer != null) {
        			ccplayer.pause();
        			ccplayer = null;
        		}
        		$("#ccPlayerDiv").empty();
        	}
        	// 保利威视，移除播放器
    		var plvDiv = document.getElementById("plvDiv");
    		if(plvDiv != null) {
    			$("#plvDiv").remove();
    		}
        	// 测试课中，停止并移除视频
        	var showMp4Div = document.getElementById("showMp4Div");
    		if(showMp4Div != null) {
    			if(typeof(videoObject) != "undefined" && typeof(videoObject) == "object") {
    				videoObject.controls.stop();
        			$("#showMp4Div").remove();
    			}
    		}
        	//测试课 
        	if (testOrWare[0] == "test"){
        		// 是否分时展现测试题
        		var url = "contextPath/web/player!judgeShowExamTime.do";
        		myLandAjaxJson(url, "", function(code, ajaxPara) {
        			if("00" == code) {
                   	    var temp = eval("("+ajaxPara+")");
                   	    showExamTime = temp.code;     				
        			}
                });
        		
        		$(".course_detail_right").css({"height": ""});
        		$(".video2_message").css({
        			"height": "", 
        			"max-height": "480px",
        			"overflow-y": "auto"
        		});
        		$("#player").hide();
        		$("#testClass").show();
        		$("#con").show();
        		doPlayCourseExam(testOrWare[1]);
        	} else{
        		$(".course_detail_right").css({"height": "540px"});
        		//播放课件---防止播放测试课后无法切换课件播放
        		$("#player").show();
        		$("#testClass").hide();
        		$("#con").hide();
        		$("#load").hide();
        		doPlayCourseWare(filePath, wareSum, wareNum, playerType, fileNameCc);
        	}
        	chapterPlay = true;
        }
    }
    
    /**
     * 人脸识别弹出框
     */
    function fees(flag){
    	//每次验证前都验证修改为未通过
    	facesPass=0;
    	var content2;
    	//检测或者是识别
        if(flag =='1'){//检测
        	 content2 = "<iframe src='"+contextPath+"/web/faceVerify/facePhotograph.jsp' width='800px' height='480px' scrolling='no' frameborder='0' style='margin-top:0px'></iframe>";
        } else if(flag == "4") {	// 内网采集
        	content2 = "<iframe src='"+contextPath+"/web/faceVerify/faceIntranet.jsp' width='800px' height='480px' scrolling='no' frameborder='0' style='margin-top:0px'></iframe>";
        } else if(flag == "5") {	// 采集验证（无框）
        	content2 = "<iframe src='"+contextPath+"/web/faceVerify/faceVerifyNoBorder.jsp' width='800px' height='480px' scrolling='no' frameborder='0' style='margin-top:0px'></iframe>";
        } else{//识别
        		content2 = "<iframe src='"+contextPath+"/web/faceVerify/faceVerify.jsp' width='800px' height='480px' scrolling='no' frameborder='0' style='margin-top:0px'></iframe>";
        }
    	TINY.box.show(content2,0,801,480,1);
    }
    /**
     *重播，下一页，上一页，小圆点
     */
     function showPrev(){//上一页
    	 if(new Date().getTime()-clickTime < 3000) {
			 return;
		 }
    	 clickTime = new Date().getTime();	// 记录当前时间
         if (preNode == ""){
             mylandAlert("信息提示","当前课件是第一个课件，上一页没有内容！");
             return;
         }
         chapterWareId = preNode;
         chapterId = preChapterId;
         firstWareMark = 1;
         curCourseId = getCurCourseId(chapterId);
         selectingNode = zTreeObj.getNodeByParam("id",chapterId, null);
         player_mp4(chapterId,curCourseId);
     }
     
     /**
      * 通过当前点击的chapterId获取courseId
      * @param tempChapterId
      * @returns
      */
     function getCurCourseId(tempChapterId){
    	 var snode = zTreeObj.getNodeByParam("id",tempChapterId, null);
    	 return snode.courseId;
     }
     
     /**
      * 下一页播放
      */
     function showNext(){
    	 if(new Date().getTime()-clickTime < 3000) {
			 return;
		 }
    	 clickTime = new Date().getTime();	// 记录当前时间
         if (nxtNode == "over" && sumStudyTime >= targetStudyTime && wareCount >= studyCount){
         	mylandAlert("信息提示","恭喜您已完成本课程的学习");
            return;
         }
         if (nxtNode == "over" && sumStudyTime < targetStudyTime){
             mylandAlert("信息提示","本课程已学完，请点击学习下一课程！");
             return;
         }
         // 检验当前课件是否已播放完成，已播放完成，下一课件可播放；未播放完成，下一课件不可播放
         var isLearnedFlag = false;
         var url = contextPath+"/web/player!judgeOneChapterWareIsLearned.do?"+
         	"curCourseId="+getCurCourseId(chapterId)+"&chapterIds="+chapterId+"&chapterWareId="+wareId;
         myLandAjaxJson(url, "", function(code, ajaxPara) {
        	 var temp = eval("("+ajaxPara+")");
        	 if(temp.code == "00") {
        		 isLearnedFlag = true;
        	 } else if(temp.code == "11") {
        		 isLearnedFlag = false;
        		 mylandAlert("信息提示",temp.message);
        	 }
         });
         if(isLearnedFlag) {
             chapterWareId = nxtNode;
             chapterId = nxtChapterId;
             firstWareMark = 1;
             curCourseId = getCurCourseId(chapterId);
             selectingNode = zTreeObj.getNodeByParam("id",chapterId, null);
             player_mp4(chapterId,curCourseId);
         }
     }
     
     /**
      * 重播
      */
     function showReset(){
    	 chapterWareId = curNode;
         chapterId = chapterId;
         firstWareMark = 1;
         //判断是到以后一课时点击下一页之后courceId为空，重播找不到课件一直加载的问题
         if(chapterId==''||chapterId==null){
        	 chapterId = parseInt(preChapterId)+1;
         } 
         curCourseId = getCurCourseId(chapterId);
         player_mp4(chapterId,curCourseId);
     }
     
     /**
      * 点击小圆点播放
      * @param num
      */
     function showNum(num){
    	 if(new Date().getTime()-clickTime < 3000) {
			 return;
		 }
    	 clickTime = new Date().getTime();	// 记录当前时间
    	 var cjtime = new Date();
    	 curCourseId = getCurCourseId(chapterId);
    	 var data = 'chapterIds=' + chapterId + '&num=' + num + '&cj=' + cjtime + '&curCourseId=' + curCourseId;
 		 var url=contextPath+"/web/player!getWareId.do?"+data;
 		 myLandAjaxJson(url,"",getWareBack);
     }
     /**
      * showNum获取课件信息回调函数
      * @param code
      * @param ajaxPara
      */
     function getWareBack(code,ajaxPara){
  		if("00"==code){
  			var temp = eval("("+ajaxPara+")");
  			if(temp.code=="00"){
  				 chapterWareId = temp.message;
  				 chapterId = chapterId;
  		         firstWareMark = 1;
  		         player_mp4(chapterId,curCourseId);
  			} else if(temp.code == "103") {
  				mylandAlert("信息提示",temp.message);
  			} else{
  				mylandAlert("信息提示",temp.message);
  			}
  		}else{
  			mylandAlert("信息提示",ajaxPara);
  		}
  	 }
     
     /**
      * 判断是否可播放
      */
     function playYesOrNo(num){
    	 var curCourseIdTemp = getCurCourseId(chapterId);
    	 var data = 'chapterIds=' + chapterId + '&num=' + num + '&curCourseId=' + curCourseIdTemp;
 		 var url=contextPath+"/web/player!getWareId.do?"+data;
 		 var showFlag = false;
 		 myLandAjaxJson(url,"",function(code,ajaxPara) {
 			if("00"==code){
 	  			var temp = eval("("+ajaxPara+")");
 	  			if(temp.code=="00"){
 	  				showFlag = true;
 	  			} else if(temp.code == "103") {
 	  				showFlag = false;
 	  			} else{
 	  				showFlag = false;
 	  			}
 	  		}else{
 	  			showFlag = false;
 	  		}
 		 });
 		 return showFlag;
     }
     
     /**
      * 播放操作
      * @param swfFile
      * @param wareSum
      * @param wareNum
      */
     function doPlayCourseWare(swfFile, wareSum, wareNum, playerType, fileNameCc){
     	try{
     	//	var f = ocx.ForceStop();
     	}catch(e){}
        //var port = ocx.GetAddPort();
       // var playStr = "http://127.0.0.1:"+port+swfFile + "?t=" + new Date().getTime();
     	var playStr = mylandFilePath+swfFile+ "?t=" + new Date().getTime();
     	//var playStr = "http://localhost:8081"+swfFile;
     	//var playStr = "http://localhost:8081/ware/jds2_.swf"
     	lastSwfFile = swfFile;
     	lastWareSum = wareSum;
     	lastWareNum = wareNum;
     	if (wareSum * 1 > 0) {
        	var warePageIndexDivStr = "<ul>";
        	warePageIndexDivStr += "<li class='dfss_up'><a href='javascript:showPrev();'>上一页</a></li>";
        	for (n = 0; n < wareSum * 1; n++) {
        		if (n == wareNum * 1) {	// 正在播放
        			warePageIndexDivStr += "<li class='dfss_going'><a href='javascript:showNum("+n+")'>"+(n+1)+"</a></li>";
        		} else {
        			if(playYesOrNo(n)) {	// 已经播放过
        				warePageIndexDivStr += "<li class='dfss_over'><a href='javascript:showNum("+n+")'>"+(n+1)+"</a></li>";
        			} else {	// 未播放过
        				warePageIndexDivStr += "<li><a href='javascript:showNum("+n+")'>"+(n+1)+"</a></li>";
        			}
        		}
        	}
        	warePageIndexDivStr += "<li class='dfss_down_no'>下一页</li>";
        	warePageIndexDivStr += "</ul>";
        	$("#warePageIndex").html(warePageIndexDivStr);
        }
     	
     	// 下一页是否可点击
        var url = contextPath+"/web/player!judgeOneChapterWareIsLearned.do?"+
         	"curCourseId="+getCurCourseId(chapterId)+"&chapterIds="+chapterId+"&chapterWareId="+wareId;
        myLandAjaxJson(url, "", function(code, ajaxPara) {
        	 var temp = eval("("+ajaxPara+")");
        	 if(temp.code == "00") {
        		 if($(".dfss_down_no") != null) {
        			// 当前课件学习完成，下一课件可学习
      				$(".dfss_down_no").replaceWith(
      						"<li class='dfss_down'><a href='javascript:showNext();'>下一页</a></li>");
      			}
        	 }
         });
        
        var playerTypeUrl = contextPath+"/web/player!playerType.do";
        // 通过章节Ids获得课程id
        var curCourseIdTemp = getCurCourseId(chapterId);
        var paramsData = {
 				"type" : 2,
 				"value" : {
 					"playStr" : playStr,
 					"playerType" : playerType,
 					"fileNameCc" : fileNameCc,
 					"polyvId" : polyvId,
 					"curCourseId" : curCourseIdTemp,
 					"chapterIds" : chapterId,
 					"chapterWareId" : wareId,
 					"verificationcode" : verificationcode
 				}
 		};
        myLandAjaxCommon(playerTypeUrl, paramsData, "html", function (code,data){
 		   	if(code=="00") {
 		   		try{
 		   			try{
	 		   			if(ccplayer != null){
	 		   				ccplayer = null;
	 		   			}
 		   			}catch(e){
 		   				
 		   			}
 		   			window.clearInterval(updateTime);	// 去除时间间隔函数
 		   			$("#playerDiv").replaceWith(data);
 		   		}catch(e){
 		   			mylandAlert("信息提示",e);
 		   		}
 		   	} else {
 		   		mylandAlert("信息提示",ajaxPara);
 		   	}
 	    });
        
     }
     
     /**
      * 保存学时操作
      */
     function handlePlayerInfo(){
     	isHandle = true;
        var cjtime = new Date();
        var data = 'cj=' + cjtime + '&handleType=1&curCourseId='+curCourseId;
     	var url=contextPath+"/web/player!treePlayHandle.do?"+data;
     	myLandAjaxJson(url,"",handlePlayerInfoBack);
     }
     /**
      * 保存学时回调函数
      * @param code
      * @param ajaxPara
      */
     function handlePlayerInfoBack(code,ajaxPara){
     	if("00"==code){
     		// 学习未完成--可学
     		if (!(nxtNode == "over" && sumStudyTime >= targetStudyTime && wareCount >= studyCount)){
     			if($(".dfss_down_no") != null) {
     				$(".dfss_down_no").replaceWith(
     						"<li class='dfss_down'><a href='javascript:showNext();'>下一页</a></li>");
     			}
     		}
     		
     		clearSessionInterval();
     		var temp = eval("("+ajaxPara+")");
     		if(temp.code=="00"){
     			var jsonInfo = eval("("+temp.message+")");
     			var infoCode = jsonInfo.code;
     			//为10时说明更改了最后学习结点，则进行验证下一步操作
     			if(infoCode == '10'){
     				if(jsonInfo.message != null && jsonInfo.message != ""){
         				mylandAlert("信息提示",jsonInfo.message);
         			}
     				//校验下一步操作--alert；push；course；exam等
     				checkNextNode();
     			}
     			//显示下一步可点
     			$("#showNextWare").html("<a href=\"javascript:showNext();\"><img src=\""+contextPath+"/images/webcustomer/learnPag/z1.gif\"/></a>");
     		} else if(temp.code=="001") {
     			
     		} else {
     			mylandAlert("信息提示",temp.message);
     		}
     	}else{
     		mylandAlert("信息提示",ajaxPara);
     	}
     }
     if(document.all["sb"] != null) {
    	 setSB(0, document.all["sb"]);
     }
     /**
      * 判断某一字符串是否以给定字符结尾
      */
     function endWith(str1,str2){
     	var reg=new RegExp(str2+"$");     
     	return reg.test(str1);        
     }
     /**
      * 测试课显示
      */
     //当前考题id
     var curExamId = "";
     function doPlayCourseExam(Ids){
		// 测试课
		 chapterExamId = chapterId; //记录当前测试课章节ID,防止测试课为通过点击下一步，将课程ID改变后台验证出错。
    	//清空记录做题记录map
		examMap.clear();
		examOkMap.clear();
		examIds = Ids;
    	if (examIds.length > 0){
       	 	examArray = examIds.split(",");
        	if (examArray.length > 0) {
        		if(examArray[0] > 0){
        			curExamId = examArray[0];
        		}
        	}
			getExamById(curExamId);
        }
    	else
    	{
            $('con').innerHTML = "暂无相关考题";
        }
     }
     /*根据考题ID获取考题相关信息并展现在页面上*/
     function getExamById(curExamId){
    	 $("#answerHints").html("");
    	 var cjtime = new Date();
    	 var data = 'examId=' + curExamId + "&examIds=" + examIds + '&cj=' + cjtime;
 		 var url=contextPath+"/web/player!getExamById.do?"+data;
 		 myLandAjaxJson(url,"",getExamByIdCallBack);
     }
     // getExamById的回调函数
     function getExamByIdCallBack(code,ajaxPara){
		if("00"==code){
			var temp = eval("("+ajaxPara+")");
			if(temp.code=="00"){
			//	chapterId = chapterId;
				firstWareMark = 1;
				examCorrectFlag = false;
				
				// 题目、选项是否分时显示
				if(showExamTime == "0") {	// 正常显示
					exam2(chapterId,temp.message);
				} else if(showExamTime == "1") {	// 分时显示
					exam2_showTime(chapterId,temp.message);
					setTimeout(function() {
						$("[name='tigan']").each(function() {
							$(this).slideDown(1500);
						});
					}, 500);
					setTimeout(function() {
						$("[name='xuanxiang']").each(function() {
							$(this).slideDown(1500);
						});
					}, 6000);
					var ulTopDiv = "<div id='ulTopDiv' style='position:absolute;z-index:1001;height:350px;width:680px;background-color:white;-moz-opacity: 0; opacity:0; filter: alpha(opacity=0);'></div>";
					$("#play").append(ulTopDiv);
					setTimeout(function() {
						$("#ulTopDiv").remove();
					},11000);
				}
			}else{
				mylandAlert("信息提示",temp.message);
			}
		}else{
			mylandAlert("信息提示",ajaxPara);
		}
   	 }
    //考题处理
	function exam2(chapterId,obj){
		if(obj != null){
			var json ;
			 try{
				json = eval("(" + obj + ")");
			 }catch(e){
				 mylandAlert("信息提示",e);	
			 }
			 okCheckExam = "";
			 var player=$("#con");
			 curExamId = json.examId;
			 var preKtId=json.preId;
			 var nextKtId=json.nextId;
			 var type=json.type;
			 var num = json.number;
			 //考题数量
			 var counter = examArray.length-1;
			 //题干
			 var examContent = json.content;
			  //讲解（详解）
			 var explainContent = json.explainContent;
			 if(explainContent == 'null'){
			 	explainContent="";
			 }
			  //swf文件
			 var swfContent;
			 //除去swf的题干
			 var withoutSwfContent;
			 //图片
			 var imgContent;
			 //除去图片的题干
			 var withoutImgContent;
			 if(examContent.indexOf("<img") != -1){
			 	var array = examContent.split('<img');
			 	var subarray = array[1].split('/>');//showPrompt(subarray[0]);
			 	imgContent = examContent.substring(array[0].length, array[0].length+subarray[0].length+6);
			 	withoutImgContent = array[0];
				examContent = withoutImgContent.replace("<br>", "").replace("</br>", "").replace("<br/>", "");
	
	
				var beginIndex = imgContent.indexOf('c="')+3;
				var endIndex = imgContent.lastIndexOf('.')+4;
				var imgSrc = mylandFilePath+"/"+imgContent.substring(beginIndex, endIndex);
	
				var img = new Image();
				function loadImage(url, callback) {
			        img.onload = function(){
	     			img.onload = null;
	    			    callback.call(img,img.width,img.height);
	   			}
	   			img.src = url;
		 		}
				loadImage(imgSrc,function(width,height){
					if(width < 300 && height <200){
						imgContent = '<img src="'+img.src+'" width="'+width+'px;" height="'+height+'px;"/>';//mylandAlert("信息提示",'1:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',width);
						img_new.setAttribute('height',height);
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}else if(width >= 300 && height >= 200){
						imgContent = '<img src="'+img.src+'" width="300px;" height="200px;"/>';//mylandAlert("信息提示",'2:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',"300px");
						img_new.setAttribute('height',"200px");
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}else if(width >= 300 && height<200){
						imgContent = '<img src="'+img.src+'" width="300px;" height="'+height+'px;"/>';//mylandAlert("信息提示",'3:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',"300px");
						img_new.setAttribute('height',height);
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}else if(width < 300 && height>=200){
						imgContent = '<img src="'+img.src+'" width="'+width+'px;" height="200px;"/>';//mylandAlert("信息提示",'4:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',width);
						img_new.setAttribute('height',"200px");
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}
				})
			 }
			//mp4视频路径
			var swfSrc="";
			if(examContent.indexOf("<embed") != -1){
			 	var array = examContent.split('<embed');
			 	var subarray = array[1].split('</embed>');//mylandAlert("信息提示",subarray[0]);
			 	swfContent = examContent.substring(array[0].length, array[0].length+subarray[0].length+6);
			 	var beginIndex = swfContent.indexOf('c="')+3;
				var endIndex = swfContent.lastIndexOf('.')+4;
				swfSrc = mylandFilePath+"/"+swfContent.substring(beginIndex, endIndex);
			 	withoutSwfContent = array[0];
				examContent = withoutSwfContent;
			 }
			//测试课模块
			
			var csk ="<ul style='min-height:355px;'>";
			 if(type=="0"){
				 typeStr="radio";
				 csk+='<li class=\"topics\" style=\"position:relative; \"><div class="mr50">'+num+'、(单选题)'+examContent+'</div></li>';
			 }else if(type=="1"){
				 typeStr="checkbox";
				 csk+='<li class=\"topics\" style="position:relative; "><div class="mr50">'+num+'、(多选题)'+examContent+'</div></li>';
			 }else if(type=="3"){
			 	 typeStr="radio";
				 csk+='<li class=\"topics\" style="position:relative; "><div class="mr50">'+num+'、(判断题)'+examContent+'</div></li>';
			 }
			//图片右侧显示
		   	 if(imgContent) {
		   		 csk+='<li><div id="imgDiv" class="course_pic2" style="margin:10px 10px 0px 0px;text-align:right;"><div id="img_url">'+imgContent+'</div></div></li>';
		   	 }
			 //swf右侧显示
		   	 if(swfContent){
		   		csk+='<li><div class="course_pic2" id="showMp4Div" style="margin:0px 10px 0px 0px;"><object id="videoObject" classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" TYPE="application/x-oleobject" width="300" height="225"><param name ="url" value="'+swfSrc+'"> </param> </object> </div></li>';
		   	//	csk+='<li><div class="course_pic2"><object classid="clsid:22D6F312-B0F6-11D0-94AB-0080C74C7E95" TYPE="application/x-oleobject" data="'+swfSrc+'" width="300" height="225"> </object> </div></li>';
		   	//	csk+='<li><div class="course_pic2"><embed src="'+swfSrc+'" type="application/x-shockwave-flash" loop="false" width="300" height="225" /></div></li>';
		   	 }
		   	 var options=json.options;
		   	 var optArray=options.split(",");
		   	 var opt="&nbsp;&nbsp;&nbsp;&nbsp;";
		   	 var box="";
		   	 var s="";
		   	 var t="";
		   	 var d="";//正确选项
		   	 for(var i=0;i<optArray.length;i++){
	   	 		if (i==0)	s="A";
				if (i==1) 	s="B";
				if (i==2)	s="C";
				if (i==3) 	s="D";
		   	 	var tmpArray=optArray[i].split("|");
		   	 	if(tmpArray[1]=="1"){
		   	 		//正确选项
		   	 		d+=s;
		   	 	}
		   	 }
		   	 for(var i=0;i<optArray.length;i++){
				if (i==0)	s="A";
				if (i==1) 	s="B";
				if (i==2)	s="C";
				if (i==3) 	s="D";
		   	 	var tmpArray=optArray[i].split("|");
		   	 	if(tmpArray[1]=="1"){
		   	 		//正确选项
		   	 		t=s;
		   	 		okCheckExam += s;//记录当前考题所有正确选项
		   	 	}
		   	 	if(examMap.get(curExamId)!=null && examMap.get(curExamId).indexOf(s) != -1 ){
		   	 		opt+="<li style='cursor:pointer;'><input type='"+typeStr+"' name='answer' id='answer"+i+"' value='"+s+"' onclick='doexam(\""+curExamId+"\",\""+t+"\",\""+s+"\",\""+d+"\",\""+type+"\")' checked /> &nbsp;";//
		   	 		examCorrectFlag = true;
		   	 	}else{
		   	 		opt+="<li style='cursor:pointer;'><input type='"+typeStr+"' name='answer' id='answer"+i+"' value='"+s+"' onclick='doexam(\""+curExamId+"\",\""+t+"\",\""+s+"\",\""+d+"\",\""+type+"\")' />&nbsp;";//
		   	 	}
		   	 	opt+="<span onclick='clickSelect("+i+")'>"+tmpArray[0]+"</span></li>";
		   	 	t="";
		   	 }
		   	 if(optArray.length<4){
		   		for(var x =0 ;x<4-optArray.length;x++){
		   			opt+="<li> &nbsp; &nbsp;</li>";
		   		}
		   	 }
		   	 if(type == '1' ){
	          	 opt+="<li class='pages_test'><a href='javascript:void(0);' id=\"confirmAnswer\" onclick=\'ensure(\""+curExamId+"\",\""+d+"\")'\">确认所选答案</a></li>"	;
	          }
		   	 //记录正确选项
		   	 examOkMap.put(curExamId,okCheckExam);
		   	 //答案个数
		   	 csk += opt;
		   	
			
		   	 csk+="<li class='questions' id='answerHints'></li>";
			 
	       	 if(explainContent==''){
				 csk+="<li id='explainContent' class='explain' style='display:none;'><div class='explain_conts'><h1>题目解析:</h1><p class='exp_message'>暂无讲解。</p></li>";
		   	 }else{
		   		 csk+="<li id='explainContent' class='explain' style='display:none;'><div class='explain_conts'><h1>题目解析:</h1><p class='exp_message'>"+explainContent+"</p></li>";
			 }
	       	 csk+='</ul>';
	       	 csk+='<ul style="margin-top:-20px;">';
	       	 var tempPre="";
	       	 //上一题
	       	 if(preKtId == "" || preKtId == null){
				tempPre="disabled";
         	 }else
         		tempPre="onclick=getPrevExam('"+preKtId+"','"+curExamId+"','" + type + "','" +d + "')";
	       	 var page = "";
	       	 page+="<li class=\"pages_test\">";
		   	 page+="<a href='javascript:void(0);' id='btnPrev' "+tempPre+">上一题</a>";
		   	 //下一题
		   	 var tempNext="";
	       	 if(nextKtId == "" || nextKtId == null){
	       		tempNext="disabled";
		   	 }else{
		   		tempNext="onclick=getNextExam('" + nextKtId + "','"+curExamId+"','" + type + "','" +d + "')";
		   	 }
		   	 page+="<a href='javascript:void(0);' id='btnNext' "+tempNext+">下一题</a>";
		   	 if(nextKtId==""){
		   		 page+="<a id=\"nextPlayButton\" class=\"btn_test_finsh\" onclick=decide('" +curExamId+"','" +nxtChapterId+ "','" +type + "','"+d + "')>继续学习</a>";
		   	 }
		   	 page+="</li>";
		   	 csk+=page;
		   	 csk+='<li class=\"pages_test\">&nbsp;&nbsp;第&nbsp;'+num+'&nbsp;题&nbsp;|&nbsp;共&nbsp;'+counter+'&nbsp;题&nbsp;&nbsp;</li>';
	       	 csk+='</ul>';
	       	 player.html(csk);
		}else{
			mylandAlert("信息提示","暂无考题！");
			return;
		}
		 
	 }
	
	// 题目、选项分时显示
	function exam2_showTime(chapterId,obj){
		if(obj != null){
			var json ;
			 try{
				json = eval("(" + obj + ")");
			 }catch(e){
				 mylandAlert("信息提示",e);	
			 }
			 okCheckExam = "";
			 var player=$("#con");
			 curExamId = json.examId;
			 var preKtId=json.preId;
			 var nextKtId=json.nextId;
			 var type=json.type;
			 var num = json.number;
			 //考题数量
			 var counter = examArray.length-1;
			 //题干
			 var examContent = json.content;
			  //讲解（详解）
			 var explainContent = json.explainContent;
			 if(explainContent == 'null'){
			 	explainContent="";
			 }
			  //swf文件
			 var swfContent;
			 //除去swf的题干
			 var withoutSwfContent;
			 //图片
			 var imgContent;
			 //除去图片的题干
			 var withoutImgContent;
			 if(examContent.indexOf("<img") != -1){
			 	var array = examContent.split('<img');
			 	var subarray = array[1].split('/>');//showPrompt(subarray[0]);
			 	imgContent = examContent.substring(array[0].length, array[0].length+subarray[0].length+6);
			 	withoutImgContent = array[0];
				examContent = withoutImgContent.replace("<br>", "").replace("</br>", "").replace("<br/>", "");
	
	
				var beginIndex = imgContent.indexOf('c="')+3;
				var endIndex = imgContent.lastIndexOf('.')+4;
				var imgSrc = mylandFilePath+"/"+imgContent.substring(beginIndex, endIndex);
	
				var img = new Image();
				function loadImage(url, callback) {
			        img.onload = function(){
	     			img.onload = null;
	    			    callback.call(img,img.width,img.height);
	   			}
	   			img.src = url;
		 		}
				loadImage(imgSrc,function(width,height){
					if(width < 300 && height <200){
						imgContent = '<img src="'+img.src+'" width="'+width+'px;" height="'+height+'px;"/>';//mylandAlert("信息提示",'1:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',width);
						img_new.setAttribute('height',height);
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}else if(width >= 300 && height >= 200){
						imgContent = '<img src="'+img.src+'" width="300px;" height="200px;"/>';//mylandAlert("信息提示",'2:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',"300px");
						img_new.setAttribute('height',"200px");
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}else if(width >= 300 && height<200){
						imgContent = '<img src="'+img.src+'" width="300px;" height="'+height+'px;"/>';//mylandAlert("信息提示",'3:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',"300px");
						img_new.setAttribute('height',height);
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}else if(width < 300 && height>=200){
						imgContent = '<img src="'+img.src+'" width="'+width+'px;" height="200px;"/>';//mylandAlert("信息提示",'4:'+imgContent);
						var imgDiv_new = document.getElementById("imgDiv");
						if(imgDiv_new == null) {
							imgDiv_new = document.createElement('imgDiv');
						}
						var img_new = document.createElement('img');
						img_new.setAttribute('src',img.src);
						img_new.setAttribute('width',width);
						img_new.setAttribute('height',"200px");
						imgDiv_new.appendChild(img_new);
						var img_url = document.getElementById("img_url");
						if(img_url != null) {
							img_url.parentNode.removeChild(img_url);
						}
					}
				})
			 }
			//mp4视频路径
			var swfSrc="";
			if(examContent.indexOf("<embed") != -1){
			 	var array = examContent.split('<embed');
			 	var subarray = array[1].split('</embed>');//mylandAlert("信息提示",subarray[0]);
			 	swfContent = examContent.substring(array[0].length, array[0].length+subarray[0].length+6);
			 	var beginIndex = swfContent.indexOf('c="')+3;
				var endIndex = swfContent.lastIndexOf('.')+4;
				swfSrc = mylandFilePath+"/"+swfContent.substring(beginIndex, endIndex);
			 	withoutSwfContent = array[0];
				examContent = withoutSwfContent;
			 }
			//测试课模块
			
			var csk ="<ul id='timu' style='min-height:355px;'>";
			 if(type=="0"){
				 typeStr="radio";
				 csk+='<li name="tigan" class=\"topics\" style=\"position:relative;display:none; \"><div class="mr50">'+num+'、(单选题)'+examContent+'</div></li>';
			 }else if(type=="1"){
				 typeStr="checkbox";
				 csk+='<li name="tigan" class=\"topics\" style="position:relative;display:none; "><div class="mr50">'+num+'、(多选题)'+examContent+'</div></li>';
			 }else if(type=="3"){
			 	 typeStr="radio";
				 csk+='<li name="tigan" class=\"topics\" style="position:relative;display:none; "><div class="mr50">'+num+'、(判断题)'+examContent+'</div></li>';
			 }
			//图片右侧显示
		   	 if(imgContent) {
		   		 csk+='<li name="tigan" style="display:none;"><div id="imgDiv" class="course_pic2" style="margin:10px 10px 0px 0px;text-align:right;"><div id="img_url">'+imgContent+'</div></div></li>';
		   	 }
			 //swf右侧显示
		   	 if(swfContent){
		   		csk+='<li name="tigan" style="display:none;"><div class="course_pic2" id="showMp4Div" style="margin:0px 10px 0px 0px;"><object id="videoObject" classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" TYPE="application/x-oleobject" width="300" height="225"><param name ="url" value="'+swfSrc+'"> </param> </object> </div></li>';
		   	//	csk+='<li><div class="course_pic2"><object classid="clsid:22D6F312-B0F6-11D0-94AB-0080C74C7E95" TYPE="application/x-oleobject" data="'+swfSrc+'" width="300" height="225"> </object> </div></li>';
		   	//	csk+='<li><div class="course_pic2"><embed src="'+swfSrc+'" type="application/x-shockwave-flash" loop="false" width="300" height="225" /></div></li>';
		   	 }
		   	 var options=json.options;
		   	 var optArray=options.split(",");
		   	 var opt="&nbsp;&nbsp;&nbsp;&nbsp;";
		   	 var box="";
		   	 var s="";
		   	 var t="";
		   	 var d="";//正确选项
		   	 for(var i=0;i<optArray.length;i++){
	   	 		if (i==0)	s="A";
				if (i==1) 	s="B";
				if (i==2)	s="C";
				if (i==3) 	s="D";
		   	 	var tmpArray=optArray[i].split("|");
		   	 	if(tmpArray[1]=="1"){
		   	 		//正确选项
		   	 		d+=s;
		   	 	}
		   	 }
		   	 for(var i=0;i<optArray.length;i++){
				if (i==0)	s="A";
				if (i==1) 	s="B";
				if (i==2)	s="C";
				if (i==3) 	s="D";
		   	 	var tmpArray=optArray[i].split("|");
		   	 	if(tmpArray[1]=="1"){
		   	 		//正确选项
		   	 		t=s;
		   	 		okCheckExam += s;//记录当前考题所有正确选项
		   	 	}
		   	 	if(examMap.get(curExamId)!=null && examMap.get(curExamId).indexOf(s) != -1 ){
		   	 		opt+="<li name='xuanxiang' style='cursor:pointer;display:none;'><input type='"+typeStr+"' name='answer' id='answer"+i+"' value='"+s+"' onclick='doexam(\""+curExamId+"\",\""+t+"\",\""+s+"\",\""+d+"\",\""+type+"\")' checked /> &nbsp;";//
		   	 		examCorrectFlag = true;
		   	 	}else{
		   	 		opt+="<li name='xuanxiang' style='cursor:pointer;display:none;'><input type='"+typeStr+"' name='answer' id='answer"+i+"' value='"+s+"' onclick='doexam(\""+curExamId+"\",\""+t+"\",\""+s+"\",\""+d+"\",\""+type+"\")' />&nbsp;";//
		   	 	}
		   	 	opt+="<span onclick='clickSelect("+i+")'>"+tmpArray[0]+"</span></li>";
		   	 	t="";
		   	 }
		   	 if(optArray.length<4){
		   		for(var x =0 ;x<4-optArray.length;x++){
		   			opt+="<li name='xuanxiang' style='display:none;'> &nbsp; &nbsp;</li>";
		   		}
		   	 }
		   	 if(type == '1' ){
	          	 opt+="<li name='xuanxiang' class='pages_test' style='display:none;'><a href='javascript:void(0);' id=\"confirmAnswer\" onclick=\'ensure(\""+curExamId+"\",\""+d+"\")'\">确认所选答案</a></li>"	;
	          }
		   	 //记录正确选项
		   	 examOkMap.put(curExamId,okCheckExam);
		   	 //答案个数
		   	 csk += opt;
		   	
			
		   	 csk+="<li class='questions' id='answerHints' style='display:none;'></li>";
			 
	       	 if(explainContent==''){
				 csk+="<li id='explainContent' class='explain' style='display:none;'><div class='explain_conts'><h1>题目解析:</h1><p class='exp_message'>暂无讲解。</p></li>";
		   	 }else{
		   		 csk+="<li id='explainContent' class='explain' style='display:none;'><div class='explain_conts'><h1>题目解析:</h1><p class='exp_message'>"+explainContent+"</p></li>";
			 }
	       	 csk+='</ul>';
	       	 csk+='<ul style="margin-top:-20px;">';
	       	 var tempPre="";
	       	 //上一题
	       	 if(preKtId == "" || preKtId == null){
				tempPre="disabled";
         	 }else
         		tempPre="onclick=getPrevExam('"+preKtId+"','"+curExamId+"','" + type + "','" +d + "')";
	       	 var page = "";
	       	 page+="<li class=\"pages_test\">";
		   	 page+="<a href='javascript:void(0);' id='btnPrev' "+tempPre+">上一题</a>";
		   	 //下一题
		   	 var tempNext="";
	       	 if(nextKtId == "" || nextKtId == null){
	       		tempNext="disabled";
		   	 }else{
		   		tempNext="onclick=getNextExam('" + nextKtId + "','"+curExamId+"','" + type + "','" +d + "')";
		   	 }
		   	 page+="<a href='javascript:void(0);' id='btnNext' "+tempNext+">下一题</a>";
		   	 if(nextKtId==""){
		   		 page+="<a id=\"nextPlayButton\" class=\"btn_test_finsh\" onclick=decide('" +curExamId+"','" +nxtChapterId+ "','" +type + "','"+d + "')>继续学习</a>";
		   	 }
		   	 page+="</li>";
		   	 csk+=page;
		   	 csk+='<li class=\"pages_test\">&nbsp;&nbsp;第&nbsp;'+num+'&nbsp;题&nbsp;|&nbsp;共&nbsp;'+counter+'&nbsp;题&nbsp;&nbsp;</li>';
	       	 csk+='</ul>';
	       	 player.html(csk);
		}else{
			mylandAlert("信息提示","暂无考题！");
			return;
		}
		 
	 }
	
	// 点击选项行
	function clickSelect(i) {
		$("#answer"+i).attr("checked", true);
		$("#answer"+i).click();
	}
	
	//上一题
	function getPrevExam(id,curExamId,type,d){
		var showMp4Div = document.getElementById("showMp4Div");
		if(showMp4Div != null) {
			videoObject.controls.stop();
			$("#showMp4Div").remove();
		}
		if(type == '1' ){
			ensure(curExamId,d);
		}
		getExamById(id);
	}

	//下一题
	function getNextExam(id,curKtId,type,d){
		if(!examCorrectFlag) {
			if($("[name='answer']:checked").length == 0) {
				$("#answerHints").html("<span style='font-weight:bold;color:red;'>请选择答案！</span>");
			} else {
				$("#answerHints").html("<span style='font-weight:bold;color:red;'>答案错误，请重新选择答案！</span>");
			}
			return;
		}
		
		var showMp4Div = document.getElementById("showMp4Div");
		if(showMp4Div != null) {
			if(typeof(videoObject) != "undefined" && typeof(videoObject) == "object") {
				videoObject.controls.stop();
			}
			$("#showMp4Div").remove();
		}
		if(type == '1' ){
			ensure(curKtId,d);
		}
		getExamById(id);
	}
	///显示讲解区域
	function xsjj(){
		$("#explainContent").slideToggle("slow");
	}
	// 记录学员测试信息
	function doexam(curExamId,t,s,d,type){
		if(type != '1'){//不是多选
			if(t){
				$("#answerHints").html("<span class='test_ques_02' style='font-weight:bold;color:green;'>恭喜您，回答正确！</span><span class='v_total_03' id='jiexi_01' onclick='xsjj()'>题目解析</span>");  
				$("#answerHints").show();//隐藏提示层
				$("#explainContent").hide();//显示讲解区
				examMap.put(curExamId,t);
				
				examCorrectFlag = true;
			}else{
				$("#answerHints").html("<span class=\"test_ques_02\">您的答案：</span><span class=\"test_ques_02\" style='font-weight:bold;color:red;'>"+s+"</span><span class=\"test_ques_03\">&nbsp;&nbsp;&nbsp;&nbsp;正确答案：</span><span class=\"test_ques_01\">"+d+"</span><span class='v_total_03' id='jiexi_01' onclick='xsjj()'>题目解析</span>");
				$("#answerHints").show();//显示提示层
				$("#explainContent").hide();//显示讲解区
				
				examCorrectFlag = false;
			}
		}else{
			//document.getElementById("confirmAnswer").disabled="";
		}
	}
	
	function ensure(curExamId,d){
	    var learnerDetail = "";
		var answerArray=document.getElementsByName("answer");
		for(var i=0;i<answerArray.length;i++){
			if(answerArray[i].checked){
				learnerDetail+=answerArray[i].value;
			}
		}
		if(learnerDetail == okCheckExam){
			$("#answerHints").html("<span class='test_ques_02' style='font-weight:bold;color:green;'>恭喜您，回答正确！</span><span class='v_total_03' id='jiexi_01' onclick='xsjj()'>题目解析</span>");  
			$("#answerHints").show();//隐藏提示层
			$("#explainContent").hide();//显示讲解区
			examMap.put(curExamId,learnerDetail);
			examCorrectFlag = true;
		}else{
			$("#answerHints").html("<span class=\"test_ques_02\">您的答案：</span><span class=\"test_ques_02\" style='font-weight:bold;color:red;'>"+learnerDetail+"</span><span class=\"test_ques_03\">&nbsp;&nbsp;&nbsp;&nbsp;正确答案：</span><span class=\"test_ques_01\">"+d+"</span><span class='v_total_03' id='jiexi_01' onclick='xsjj()'>题目解析</span>");
			$("#answerHints").show();//显示提示层
			$("#explainContent").hide();//显示讲解区
			examCorrectFlag = false;
		}
	}
	//判断最后一题是否正确
	function decide(curExamId,nxtChapterId,type,d){
		if(!examCorrectFlag) {
			if($("[name='answer']:checked").length == 0) {
				$("#answerHints").html("<span style='font-weight:bold;color:red;'>请选择答案！</span>");
			} else {
				$("#answerHints").html("<span style='font-weight:bold;color:red;'>答案错误，请重新选择答案！</span>");
			}
			return;
		}
		
		if(type == '1' ){
			ensure(curExamId,d);
		}
		 //获取提示层的值
		//var answerHints=$("#answerHints").html();
		 //获取当前题目选择的答案
		//var curExamId= examMap.get(curExamId);
		//通过判断提示层的值让提示层显示和隐藏
		//if(curExamId != null){
		//	$("#player").show();
		//	$("#testClass").hide();
    	//	$("#con").hide();
    		handlePlayerInfo();
    		if(nxtChapterId != null && nxtChapterId != "over") {
    			curCourseId = getCurCourseId(nxtChapterId);
        		selectingNode = zTreeObj.getNodeByParam("id",nxtChapterId, null);
                player_mp4(nxtChapterId,curCourseId);
    		}
//		}else{
//			if(answerHints == ''){
//				$("#answerHints").html("<font color=red>&nbsp;&nbsp;请选择正确答案后再继续学习。</font>");
//				$("#answerHints").show();//显示提示层
//			}else{
//				$("#answerHints").show();//显示提示层
//			}	
//		}
	}
	  var flushSessionInterval;
      
      /**
       * 进入页面启动定时器，
       * 定时获取当前学时，
       * 防止课件时间过长，出现session失效
       */
      function flushSessionIntervalFunc(){
      	//十分钟刷新一次
        flushSessionInterval = window.setInterval("flushSession()", 30000);
      }
      
       //清除定时器
      function clearSessionInterval(){
          window.clearInterval(flushSessionInterval);
          flushSessionInterval=null;
      }
      function flushSession(){
    	  myLandAjaxJson(contextPath+"/web2/flush!flush.do","",flushSessionCallBack);
      }
	 function flushSessionCallBack(code,ajaxPara){
   	  
	    	if(code=="00"){
	    		var temp = eval("("+ajaxPara+")");
				if(temp.code=="00"){
				} else {
					clearSessionInterval();
					mylandConfirmByFunc("信息提示", temp.message, function(){window.top.location.href=thirdWebSite;}, null, "确定", null);
				}
	 	   	}
	      }

