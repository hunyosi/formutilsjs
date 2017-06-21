/*
  This source code file is public domain (see LICENSE file).
*/


'use strict';

var formutilsjs = (function(wnd, doc){


function createDrillDownSelect(srcData, selects, hiddens) {

    function getElement(queryOrElm) {
        if (typeof queryOrElm === 'string') {
            return doc.querySelector(queryOrElm);
        } else {
            return queryOrElm;
        }
    }

    function getElements(queriesOrElms) {
        var result = [];
        var idx, len = queriesOrElms.length;
        for (idx = 0; idx < len; ++idx) {
            result.push(getElement(queriesOrElms[idx]));
        }
        return result;
    }


    // begin type DrillDownOption

    function DrillDownOption(parent, id, key, name) {
        this.parent = parent;
        this.id = id;
        this.key = key;
        this.name = name;
        this.children = [];
        this._childrenMap = {};
    }

    DrillDownOption.prototype.add = function(key, id, name){
        var child;
        child = this._childrenMap[key];
        if (child) {
            if (child.id == null) {
                child.id = id;
                child.name = name;
            }
            return child;
        }
        child = new DrillDownOption(this, id, key, name);
        this.children.push(child);
        this._childrenMap[key] = child;
        return child;
    };

    DrillDownOption.prototype.child = function(key){
        return this._childrenMap[key];
    };

    DrillDownOption.prototype.has = function(key){
        return key in this._childrenMap;
    };

    DrillDownOption.prototype.depth = function(){
        var depth = 0;
        var parent;
        for (parent = this.parent; parent; parent = parent.parent) {
            ++depth;
        }
        return depth;
    }

    DrillDownOption.prototype.isEmpty = function(){
        return this.children.length < 1;
    }

    // end type DrillDownOption


    function convertToDrillDownOptionPatams(srcRow) {
        var name, path, key, idx, len, srcElm;
        name = srcRow[0];
        path = [];
        len = srcRow.length;
        for (idx = 1; idx < len; ++idx) {
            srcElm = srcRow[idx];
            if (srcElm == null) break;
            path.push(srcElm);
        }
        key = path.pop();
        return {name: name, path: path, key: key};
    }


    function createAndAddDrillDownOption(root, id, srcRow) {
        var params = convertToDrillDownOptionPatams(srcRow);
        var parent = root;
        var path = params.path;
        var cur;

        while (path.length > 0) {
            cur = path.shift();
            parent = parent.has(cur) ? parent.child(cur) : parent.add(cur);
        }

        return parent.add(params.key, id, params.name);
    }


    function createDrillDownOptionTree(srcData) {
        var root, idx, len, srcRow, child, dstAry;
        root = new DrillDownOption(null, null, null, null);
        len = srcData.length;
        dstAry = new Array(len);
        for (idx = 0; idx < len; ++idx) {
            srcRow = srcData[idx];
            child = createAndAddDrillDownOption(root, idx + 1, srcRow);
            dstAry[idx] = child;
        }
        return {root:root, flatList:dstAry};
    }

    function createChangeEventHandler(self, selectElm, depth) {
        return function(){
            var selectedIndex = selectElm.selectedIndex;
            var selectedOption = selectElm.options[selectedIndex];
            var selectedValue = selectedOption.value;
            if (selectedValue) {
                self.selected(selectedValue - 1);
            } else {
                self.clear(depth);
            }
        };
    }

    function addChangeEventListeners(self) {
        var idx, len, handler, select;
        var selects = self.selects;
        len = selects.length;
        for (idx = 0; idx < len; ++idx) {
            select = selects[idx];
            handler = createChangeEventHandler(self, select, idx + 1);
            select.addEventListener('change', handler, false);
        }
    }

    function clearChildDomNodes(domNode) {
        while (domNode.lastChild) {
            domNode.removeChild(domNode.lastChild);
        }
    }

    function appendOption(select, value, text) {
        var textNode;
        var option = doc.createElement('option');
        if (value != null) {
            option.value = value;
        }
        if (text != null) {
            textNode = doc.createTextNode(text);
            option.appendChild(textNode);
        }
        select.appendChild(option);
    }

    function putOptions(select, parent) {
        var idx, len, children, child;
        clearChildDomNodes(select);
        if (parent.isEmpty()) {
            return;
        }
        appendOption(select, null, null);
        children = parent.children;
        len = children.length;
        for (idx = 0; idx < len; ++idx) {
            child = children[idx];
            appendOption(select, child.id, child.name);
        }
        select.style.visibility = 'visible';
    }

    function clearHiddens(hiddens, begin) {
        var idx, len;
        len = hiddens.length;
        for (idx = begin - 1; idx < len; ++idx) {
            hiddens[idx].value = null;
        }
    }

    function clearSelects(selects, begin) {
        var idx, len, select;
        len = selects.length;
        for (idx = begin - 1; idx < len; ++idx) {
            select = selects[idx];
            select.style.visibility = 'hidden';
            clearChildDomNodes(select);
        }
    }

    // begin type DrillDownSelect

    function DrillDownSelect(srcData, selects, hiddens) {
        var treeData = createDrillDownOptionTree(srcData);
        this.root = treeData.root;
        this.flatList = treeData.flatList;
        this.selects = getElements(selects);
        this.hiddens = getElements(hiddens);
        addChangeEventListeners(this);
    }

    DrillDownSelect.prototype.initialize = function(){
        clearHiddens(this.hiddens, 1);
        clearSelects(this.selects, 1);
        putOptions(this.selects[0], this.root);
    };

    DrillDownSelect.prototype.clear = function(depth){
        clearHiddens(this.hiddens, depth);
        clearSelects(this.selects, depth + 1);
    };

    DrillDownSelect.prototype.selected = function(id){
        var selectedOpt = this.flatList[id];
        var depth = selectedOpt.depth();
        var nextDepth = depth + 1;
        clearHiddens(this.hiddens, nextDepth);
        clearSelects(this.selects, nextDepth);
        if (depth - 1 < this.hiddens.length) {
            this.hiddens[depth - 1].value = selectedOpt.key;
        }
        if (nextDepth - 1 < this.selects.length) {
            putOptions(this.selects[nextDepth - 1], selectedOpt);
        }
    };

    // end type DrillDownSelect


    // initialize

    var obj = new DrillDownSelect(srcData, selects, hiddens);
    obj.initialize();
}




function createWatcher(target, handler, opts) {
    var targetElms = target;
    if (typeof target === 'string') {
        targetElms = document.querySelectorAll(target);
    }
    if (!targetElms) {
        return null;
    }
    if (!targetElms.length) {
       targetElms = [targetElms];
    }
    if (typeof handler !== 'function') {
        return null;
    }

    var dontStart = false;
    var invervalMSec = 100;
    if (opts != null && typeof opts === 'object') {
        if ('dontStart' in opts) dontStart = opts.dontStart;
        if ('invervalMSec' in opts) invervalMSec = opts.invervalMSec;
    }

    function getStat(elms) {
        var elm, idx, len = elms.length, res = [];
        var radios = {}, radInfo, radAry, radName, resObj;
        for (idx = 0; idx < len; ++idx) {
            elm = elms[idx];

            if ('selectedIndex' in elm) {
                res.push({
                    type: elm.type,
                    target: elm,
                    status: elm.selectedIndex,
                    value: elm.options[elm.selectedIndex].value
                });
                continue;
            }

            var type = elm.type;

            if (type === 'checkbox') {
                res.push({
                    type: elm.type,
                    target: elm,
                    status: elm.checked,
                    value: (elm.checked ? elm.value : null)
                });
                continue;
            }

            if (type === 'radio') {
                radName = elm.name;
                radInfo = radios[radName];
                if (!radInfo) {
                    radInfo = {
                       index: res.length,
                       buttons: []
                    };
                    radios[radName] = radInfo;
                    res.push({
                        type: elm.type,
                        target: elm,
                        status: -1,
                        value: null,
                        radioGroup: radInfo.buttons
                    });
                }
                radInfo.buttons.push(elm);
                continue;
            }

            res.push({
                type: elm.type,
                target: elm,
                status: elm.value,
                value: elm.value
            });
        }

        for (radName in radios) {
            radInfo = radios[radName];
            radAry = radInfo.buttons;
            resObj = res[radInfo.index];

            len = radAry.length;
            for (idx = 0; idx < len; ++idx) {
                elm = radAry[idx];
                if (elm.checked) {
                    resObj.status = idx;
                    resObj.value = elm.value;
                    break;
                }
            }
        }

        return res;
    }

    function equalsStat(statA, statB) {
        var idx, len, elmA, elmB;
        if (statA.length !== statB.length) {
            return false;
        }
        len = statA.length;
        for (idx = 0; idx < len; ++idx) {
            elmA = statA[idx];
            elmB = statB[idx];
            if (elmA.type !== elmB.type) {
                return false;
            }
            if (elmA.status !== elmB.status) {
                return false;
            }
        }
        return true;
    }

    var prevStat = getStat(targetElms);
    var intervalId = null;

    function watchHandler() {
        var curStat = getStat(targetElms);
        if (!equalsStat(curStat, prevStat)) {
            handler(prevStat, curStat);
        }
        prevStat = curStat;
    }

    var methods = {
        start: function(){
            if (intervalId !== null) {
                return;
            }
            intervalId = wnd.setInterval(watchHandler, invervalMSec);
        },
        stop: function(){
            if (intervalId === null) {
                return;
            }
            wnd.clearInterval(intervalId);
        },
        setIntervalMSec: function(val){
            invervalMSec = val|0;
        }
    };

    if (!dontStart) {
        methods.start();
    }

    return methods;
}




return {
    createDrillDownSelect: createDrillDownSelect,
    createWatcher: createWatcher
};

})(window, document);
