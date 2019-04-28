'use strict';

var Vote = function(obj){
	if (typeof obj === "string") {
        obj = JSON.parse(obj)
    }
    if (typeof obj === "object") {
        this.id = obj.id;
        // 标题
        this.title = obj.title;
        // 作者，钱包地址
        this.author = obj.author;//wallet addr
        // 创建时间
        this.createtime = obj.createtime;
        // 投票开始时间
        this.starttime = obj.starttime;
        // 投票结束时间
        this.endtime = obj.endtime;
        // 投票项
        this.options = obj.options;
        // 投票者
        this.voters = obj.voters;
        // 是否已删除
        this.isdel = obj.isdel;
    }else {
    	this.id = "";
        this.title = "";
        this.author = "";//wallet addr
        this.createtime = 0;
        this.starttime = 0;
        this.endtime = 0;
        this.options = null;
        this.voters = null;
        this.isdel = false;
    }
};
Vote.prototype = {
	toString: function () {
        return JSON.stringify(this);
    },
    // 添加投票项
    addOption:function(option){
    	if(this.options == null){
    		this.options = [];
    	}
    	if (typeof option != "undefined"){
    		this.options.push(option);
    	}
    },
    // 记录投票者
    addVoter:function(addr){
    	if(this.voters == null){
    		this.voters = [];
    	}
    	if (typeof addr != "undefined"){
    		this.voters.push(addr);
    	}
    }
};
//VoteOption
var VoteOption = function(obj){
	if (typeof obj === "string") {
        obj = JSON.parse(obj)
    }
    if (typeof obj === "object") {
        this.key = obj.key;
        this.title = obj.title;
        this.link = obj.link;
        this.votenum = obj.votenum;
    }else {
    	this.key = "";
        this.title = "";
        this.link = "";
        this.votenum = 0;
    }
};
VoteOption.prototype = {
	toString: function () {
        return JSON.stringify(this);
    }    
};


var VoteContract = function () {
    LocalContractStorage.defineProperties(this, {
        _name: null,
        _creator: null,
        _index : 0
    });

    LocalContractStorage.defineMapProperties(this, {
        "votes": {
            parse: function (value) {
                return new Vote(value);
            },
            stringify: function (o) {
                return o.toString();
            }
        },
        "voteHis": {
            parse: function (value) {
                return value.toString();
            },
            stringify: function (o) {
                return o.toString();
            }
        },
        "voteKeys": {
        	parse: function (value) {
        		return value.toString();
        	},
        	stringify: function (o) {
        		return o.toString();
        	}
        }
    });
};

VoteContract.prototype = {
    init: function () {
        this._name = "Nebulas VoteContract.";
        this._creator = Blockchain.transaction.from;
        this._index = 0;
    },

    name: function () {
        return this._name;
    },
    // 发起投票
    vote: function (voteid,options) {
    	//Record voting
    	var from = Blockchain.transaction.from;
    	var vote = this.votes.get(voteid);
    	
    	if(this.voteHis.get(from + voteid)){
    		throw new Error("Account has been voted!");
    	}
    	
    	if(!vote){
    		throw new Error("Unregistered vote!");
    	}
    	
    	var opts = options.split('@');
    	
    	if(opts.length == 1 && opts[0] == ''){
    		throw new Error("No voting data!");
    	}
    	
    	var voteOptions = vote.options; 
    	if(voteOptions != null){
    		for(var i=0;i<voteOptions.length;i++){
    			for(var k=0;k<opts.length;k++){
    				if(voteOptions[i].key === opts[i]){
    					voteOptions[i].votenum += 1; 
    				}
    			}
    		}
    		vote.options = voteOptions;
    		vote.addVoter(from);
    		this.votes.set(voteid,vote);
    		this.voteHis.set(from+voteid,voteid);
    	}
    },
    // 新增投票
    addVote: function (title,starttime,endtime,options) {
    	//add new vote
    	var from = Blockchain.transaction.from;
    	var times = Blockchain.transaction.timestamp.toString(10);
    	var voteid = from + times;
    	var opts = options.split('@');
    	var arrOpt = [];
    	for(var i=0;i<opts.length;i++){
    		var tmp = opts[i].split('=');
    		if(tmp.length >= 2){
                var item = JSON.parse(tmp[1]);
    			var voteOption = new VoteOption({
    				key : tmp[0],
                    title : item.name,
                    link: item.link,
    				votenum : 0
    			});
    			arrOpt.push(voteOption);
    		}
    	}
        var vote = new Vote({
        	id : voteid,
            title : title,
            author : from,//wallet addr
            createtime : times,
            starttime : starttime,
            endtime : endtime,
            options : arrOpt,
            voters : null,
            isdel : false
        });
        this.votes.set(voteid,vote);
        this._index++;
        this.voteKeys.set(this._index,voteid);
    },
    // 删除投票
    removeVote:function (voteid) {
    	//Terminate the vote
    	var from = Blockchain.transaction.from;
    	if(this._creator === from){
    		var tmp = this.votes.get(voteid);
    		tmp.isdel = true;
    		this.votes.set(voteid,tmp);
    	}else{
    		throw new Error("Only allow administrators to call this method!");
    	}
    },
    // 获取投票详情
    getVoteInfo:function (voteid) {
    	//get vote info by id
    	var from = Blockchain.transaction.from;
    	var vote = this.votes.get(voteid);
        if(!vote)
            throw new Error("The vote does not exist!");
       return vote;
    },
    // 获取投票列表
    getVoteList: function () {
    	var list = [];
    	for(var i=1;i<=this._index;i++){
    		var key = this.voteKeys.get(i);
    		var vote = this.votes.get(key);
    		if(!vote.isdel){
    			list.push(this.votes.get(key));
    		}
    	}
        return list;
    }
};
module.exports = VoteContract;