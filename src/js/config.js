"use strict";
var config = {
		chainId:1,
		apiPrefix:"https://mainnet.nebulas.io",//https://testnet.nebulas.io  https://mainnet.nebulas.io
		
		contractAddr:"n1pboba4SUvjyFrGLT8gxH1WR2nfahWSb52",//deploy hash// 合约地址
		
		address :"n1G2qdFLkiT77AwjvAZQHg5Evh3o3kFyiUP",//admin// 管理员钱包地址
		currentAddress: "",
		// 是否为管理员，通过当前浏览器绑定的钱包与address匹配
		isAdmin: false,
		// 投票结束次数
		voteTimesLimit: 10,
		gaslimit : 2000000,
		gasprice : 1000000,
		vote:"vote",
		addVote:"addVote",
		removeVote:"removeVote",
		getVoteInfo:"getVoteInfo",
		getVoteList:"getVoteList",
		checkTxhash:"https://explorer.nebulas.io/#/tx/"
};
var nebulas = require("nebulas"),
neb = new nebulas.Neb(),
nonce = 0;

var NebPay = require("nebpay");
var nebPay = new NebPay();    
var serialNumber;
var defaultOptions = {
		goods: {        //Dapp端对当前交易商品的描述信息，app暂时不展示
			name: "",       //商品名称
			desc: "",       //描述信息
			orderId: "",    //订单ID
			ext: ""         //扩展字段
		},
		qrcode: {
			showQRCode: false,      //是否显示二维码信息
			container: undefined    //指定显示二维码的canvas容器，不指定则生成一个默认canvas
		},
		// callback 是记录交易返回信息的交易查询服务器地址，不指定则使用默认地址
		callback: undefined,
		// listener: 指定一个listener函数来处理交易返回信息（仅用于浏览器插件，App钱包不支持listener）
		listener: undefined,
		// if use nrc20pay ,should input nrc20 params like name, address, symbol, decimals
		nrc20: undefined
};
function query(method,args,callback){
	if(typeof method != "undefined"){ 
		try{
			neb.setRequest(new nebulas.HttpRequest(config.apiPrefix));
			neb.api.getAccountState(config.address).then(function (resp) {
				nonce = parseInt(resp.nonce || 0) + 1;
				neb.api.call({
					from: config.address,
					to: config.contractAddr,
					value: 0,
					nonce: nonce,
					gasPrice: config.gasprice,
					gasLimit: config.gaslimit,
					contract: {
						"function": method,
						"args": args
					}
				}).then(function (resp) {
					callback(resp);
				}).catch(function (err) {
					callback(err);
					console.log(err);
				});
			}).catch(function (e) {
				callback(e);
				console.log(e);
			});
		}catch(e){
			callback(e);
		}
	}
}


Date.prototype.toLocaleString = function() {
    return this.getFullYear() + "/" + (this.getMonth() + 1) + "/" + this.getDate() + " " + this.getHours() + ":" + this.getMinutes();
};
