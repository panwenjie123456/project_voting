 
/**
 *  --- 表单数据接收格式化 ---
 *  @param1 form_id* 表单选择器
 *  @param2 boolean false  是否返回json数据，默认为false
 *  @param3 callback 回调函数，参数是返回的obj||json, 处理完数据调用自定义方法
 *  @return obj||json
 */
var customSerialize = function(form, json, callback) {
var arr = $(form).serializeArray();
var tmp = {};
var res2 = {};
//处理array
$.each(arr, function(k, v) {
    tmp[v.name] = v.value;
});
$.each(tmp, function(k, v) {
    res2[k] = v;
});
$.each(res2, function(k, v) {
    var path = k.split('-');
    var k2 = path.pop();
    var next_node = res2;
    $.each(path, function(k2, node) {
        if (!next_node[node]) next_node[node] = {};
        next_node = next_node[node];
    });
    next_node[k2] = v;
});
var newRes2 = {};
$.each(res2, function(k, v) {
  if (k.indexOf('-') === -1){
    newRes2[k] = v;
  }
});

if (arguments[1] && arguments[1] == true) {
    var json = JSON.stringify(newRes2);
    if (callback) callback(json);
    return json;
} else {
    if (callback) callback(newRes2);
    return newRes2;
}
};
var itemNum = 3;
$(function() {
// 创建新的投票
$('#addNewVote')
  .unbind('click')
  .click(function() {
    var forms = document.getElementsByClassName('needs-validation');
    var validation = Array.prototype.filter.call(forms, function(form) {
      if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        customSerialize('.needs-validation', false, function (json){
          var votetitle = '',
            starttime = '',
            endtime = '';
          var opts = [];
          var itemObj = {};
          $.each(json, function(key, item) {
            if (key == 'votetitle') {
              votetitle = item;
            } else if (key == 'starttime') {
              starttime = item;
            } else if (key == 'endtime') {
              endtime = item;
            } else if (item instanceof Object) {
              opts.push(key + '=' + JSON.stringify(item));
            } else {
              opts.push(key + '=' + item);
            }
          });
          starttime = new Date(starttime).getTime();
          endtime = new Date(endtime).getTime();
          addVote(votetitle, starttime, endtime, opts.join('@'));
        });
      }
      form.classList.add('was-validated');
    });
  });
$('#addVoteToOpts')
  .unbind('click')
  .click(function() {
    var args = $('.needs-validation1').serializeArray();
    if (args.length == 1) {
      alert('Please Choose at least one option');
    } else {
      var opts = [],
        voteid = '';
      $.each(args, function(index, item) {
        if (item.name == 'voteid') {
          voteid = item.value;
        } else {
          opts.push(item.name);
        }
      });
      vote(voteid, opts.join('@'));
    }
  });

$('#additem').click(function() {
  var html = [];
  html.push('<div class="input-group mb-3">');
  html.push('<div class="input-group-prepend">');
  html.push(
    '<span class="input-group-text" id="basic-addon1">Candidate</span>',
  );
  html.push('</div>');
  html.push(
    '<input type="text" placeholder="Please Input Candidate Name" class="form-control" name="item' +
      itemNum +
      '-name"  aria-label="Candidate" aria-describedby="basic-addon1" required>'
      +'<input type="text" class="form-control" name="item' +
      itemNum +
      '-link" placeholder="Please Input Candidate Introduce link" />',
  );
  html.push('<div class="input-group-append" style="cursor:pointer;">');
  html.push(
    '<span class="input-group-text itemdel" id="basic-addon2">Delete</span>',
  );
  html.push('</div>');
  html.push(' <div class="invalid-feedback">Please Input Option</div>');
  html.push('</div>');
  $('#itemContainer').append(html.join(''));
  itemNum++;
  $('.itemdel')
    .unbind('click')
    .click(function() {
      $(this)
        .parents('div.mb-3')
        .remove();
      return false;
    });
  return false;
});
//getVoteList()
getVoteList();
});
$('.voteContainer').on('click', 'button.del-js', function() {
var msg = "Delete?";
if (confirm(msg)==true){
  delVote($(this).attr('vote-id'));
}
})
function openAddVoteModal() {
$('.txResult').remove();
$('input').val('');
$('#newVote').modal('show');
}
function addVoteCallback(data) {
$('#newVote').modal('hide');
}
function addVote(title, starttime, endtime, opts) {
defaultOptions.listener = addVoteCallback;
nebPay.call(
  config.contractAddr,
  '0',
  config.addVote,
  JSON.stringify([title,starttime,endtime,opts]),
  defaultOptions,
); //to, value, func, args, options
}
function removeVoteCallback(data) {
getVoteList();
}
function delVote(voteid) {
defaultOptions.listener = removeVoteCallback;
nebPay.call(
  config.contractAddr,
  '0',
  config.removeVote,
  '["' + voteid + '"]',
  defaultOptions,
); //to, value, func, args, options
}
function voteCallback(data) {
$('#voteModal').modal('hide');
}
function vote(id, opts) {
defaultOptions.listener = voteCallback;
nebPay.call(
  config.contractAddr,
  '0',
  config.vote,
  '["' + id + '","' + opts + '"]',
  defaultOptions,
); //to, value, func, args, options
}
var voteList = [];
function getVoteList() {
var curTime = new Date().getTime();
$('.voteContainer').html(
  '<div class="alert alert-warning w-100" role="alert">Reading voting data from the nebula chain...</div>',
);
query(config.getVoteList, '', function(data) {
  if (
    typeof data.execute_err != 'undefined' &&
    data.execute_err.length == 0
  ) {
    if (data.execute_err.length > 0) {
      alert('Fail to load vote list：' + data.execute_err);
      return;
    } else {
      voteList = JSON.parse(data.result);
      voteList.reverse();
      console.log(voteList);
      var votes = [];
      $.each(voteList, function(index, vote) {
        votes.push('<div class="col-md-4">');
        votes.push('<div class="card mb-4 box-shadow">');
        votes.push('<div class="card-body">');
        if (vote.author === config.address) {
          votes.push('<button vote-id="' + vote.id + '" class="del-js btn btn-sm fr text-danger">Delete</button>');
        }
        votes.push(
          '<p class="card-text votetitle">' + vote.title + '</p>',
        );
        votes.push(
          '<div class="d-flex justify-content-between align-items-center">',
        );
        votes.push('<div class="btn-group">');
        votes.push(
          '<button type="button" class="btn btn-sm btn-outline-secondary voteResultbtn" voteid="' +
            vote.id +
            '">View Results</button>',
        );
        // 投票未过期，且次数少于10次，才可以继续投票
        if (curTime < vote.endtime && (!vote.voters || (vote.voters instanceof Array && vote.voters.length < config.voteTimesLimit))) {
          votes.push(
            '<button type="button" class="btn btn-sm btn-outline-secondary votebtn" voters="'+vote.voters+'" voteid="' +
              vote.id +
              '">Vote</button>',
          );
          votes.push('</div>');
          votes.push('<small class="text-muted">Processing</small>');
        } else {
          votes.push('</div>');
          votes.push('<small class="text-muted">End</small>');
        }
        votes.push('</div>');
        votes.push('</div>');
        votes.push('</div>');
        votes.push('</div>');
      });
      $('.voteContainer').html('');
      $('.voteContainer').html(votes.join(''));
      $('.votebtn')
        .unbind('click')
        .click(function() {
          if ($(this).attr('voters').indexOf(config.currentAddress) > -1) {
            // 当前用户已经投过票了
            alert('Each people can only vote for one time!');
          } else {
            voteOpts($(this).attr('voteid'));
          }
        });
      $('.voteResultbtn')
        .unbind('click')
        .click(function() {
          voteResult($(this).attr('voteid')); //voteResultContainer
        });
    }
  } else {
    alert(data.execute_err);
  }
});
}
function voteOpts(voteid) {
initVoteOptsToModal(voteid);
$('#voteModal').modal('show');
}

function initVoteOptsToModal(voteid) {
$('.txResult').remove();
$('.needs-validation1').html('');
var vote = {};
for (var i = 0; i < voteList.length; i++) {
  if (voteList[i].id === voteid) {
    vote = voteList[i];
    break;
  }
}
$('.needs-validation1').append(
  '<input type="hidden" name="voteid" value=' + vote.id + '>',
);
$('.needs-validation1').append(
  '<p class="text-primary">' + vote.title + '</p>',
);
var html = [],
  votenum = 0;

for (var i = 0; i < vote.options.length; i++) {
  votenum += parseInt(vote.options[i].votenum);
}

for (var i = 0; i < vote.options.length; i++) {
  var num = parseInt(vote.options[i].votenum),
    per = 0;
  if (votenum > 0) {
    per = (num / votenum) * 100;
    per = per.toFixed(2);
  }
  html.push(
    '<div class="custom-control custom-checkbox" style="margin-top:10px;">',
  );
  html.push(
    '<input type="checkbox" class="custom-control-input" id="' +
      vote.options[i].key +
      '" name="' +
      vote.options[i].key +
      '">',
  );
  html.push(
    '<label class="custom-control-label" for="' +
      vote.options[i].key +
      '">' +
      vote.options[i].title +
      '</label><a style="float:right" target="_blank" href="'+vote.options[i].link+'">View link</a>',
  );
  html.push('<div class="progress">');
  html.push(
    '<div class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ' +
      per +
      '%;color:#000;" aria-valuenow="' +
      per +
      '" aria-valuemin="0" aria-valuemax="100">' +
      num +
      per +
      '%</div>',
  );
  html.push('</div>');
  html.push('</div>');
}

$('.needs-validation1').append(html.join(''));
}
function voteResult(voteid) {
initVoteResultToModal(voteid);
$('#voteresultModal').modal('show');
}
function initVoteResultToModal(voteid) {
$('.txResult').remove();
$('#voteResultContainer').html('');
var vote = {};
for (var i = 0; i < voteList.length; i++) {
  if (voteList[i].id === voteid) {
    vote = voteList[i];
    break;
  }
}
$('#voteResultContainer').append(
  '<p class="text-primary">' + vote.title + '</p>',
);
var html = [],
  votenum = 0;

for (var i = 0; i < vote.options.length; i++) {
  votenum += parseInt(vote.options[i].votenum);
}

for (var i = 0; i < vote.options.length; i++) {
  var num = parseInt(vote.options[i].votenum),
    per = 0;
  if (votenum > 0) {
    per = (num / votenum) * 100;
    per = per.toFixed(2);
  }
  html.push(
    '<div class="custom-control custom-checkbox" style="margin-top:10px;">',
  );
  html.push(
    '<input type="checkbox" class="custom-control-input" id="' +
      vote.options[i].key +
      '" name="' +
      vote.options[i].key +
      '">',
  );
  html.push(
    '<label class="custom-control-label" for="' +
      vote.options[i].key +
      '">' +
      vote.options[i].title +
      '</label><a style="float:right" target="_blank" href="'+vote.options[i].link+'">View link</a>',
  );
  html.push('<div class="progress">');
  html.push(
    '<div class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ' +
      per +
      '%;color:#000;" aria-valuenow="' +
      per +
      '" aria-valuemin="0" aria-valuemax="100">' +
      num +
      per +
      '%</div>',
  );
  html.push('</div>');
  html.push('</div>');
}

$('#voteResultContainer').append(html.join(''));
}

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function() {
'use strict';
window.addEventListener(
  'load',
  function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener(
        'submit',
        function(event) {
          if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        },
        false,
      );
    });
  },
  false,
);
window.addEventListener('message', function(e) {
  if (e.data && e.data.data && e.data.data.account) {
    console.info('Current wallet address', e.data.data.account);
    config.currentAddress = e.data.data.account;
    if (config.address === e.data.data.account) {
      config.isAdmin = true;
      $('#banner').show();
    }
  }
});
window.postMessage(
  {
    target: 'contentscript',
    data: {},
    method: 'getAccount',
  },
  '*',
);
})();