/*
 * ==VimperatorPlugin==
 * @name            clock.js
 * @description     clock.
 * @description-ja  とけい。
 * @author          janus_wel <janus_wel@fb3.so-net.ne.jp>
 * @version         0.11
 * @minversion      2.0pre
 * @maxversion      2.0pre
 * ==/VimperatorPlugin==
 *
 * LICENSE
 *  New BSD License
 *
 * USAGE
 *  you can customize below variables
 *
 *      clock_format:   clock format. default is '[%t]'.
 *                      available special tokens:
 *                          %t: time hh:mm
 *                          %d: day  MM/DD
 *                          %y: year YYYY
 *      clock_position: id of element that is marker of insert position.
 *                      default is 'liberator-commandline-command' ( after commandline )
 *      clock_after:    boolean that show insert after of the element
 *                      specified by 'clock_position'.
 *                      default is true.
 *
 *  refer: http://d.hatena.ne.jp/janus_wel/20081128/1227849365
 *
 *  available commands
 *
 *      :clockhide
 *      :clockappear
 *      :clockstop
 *      :clockstart
 *
 * EXAMPLE
 *  in .vimperatorrc
 *
 *      let clock_format='(%t %d)'
 *      let clock_position='liberator-commandline-prompt'
 *      let clock_after='false'
 *
 *  this exapmple show clock in before prompt.
 *
 * */

( function () {

// definitions ---
// default settings
const format   = liberator.globalVariables.clock_format   || '[%t]';
const position = liberator.globalVariables.clock_position || 'liberator-commandline-command';
let atemp      = liberator.globalVariables.clock_after;
const after =   (atemp === undefined)             ? true
              : (atemp.toLowerCase() === 'false') ? false
              : (/^\d+$/.test(atemp))             ? parseInt(atemp, 10)
              :                                     true;

// class definitions
function Clock() {
    this._initialize.apply(this, arguments);
}
Clock.prototype = {
    _initialize: function (format) {
        this._format = format;
        this._master = window.document.createElement('label');
        this._master.setAttribute('style', this._constants.style);

        this._intervalInfo = {};
    },

    _constants: {
        // default style
        style: [
            'margin: 0;',
            'padding: 1px;',
            'border: 0 none;',
            'color: black;',
            'background-color: white;',
            'font-family: monospace;',
            'font-weight: bold;',
        ].join(''),

        // prefix of id and class name
        prefix: 'liberator-plugin-clock-',

        driver: {
            t: function (label) {
                return setInterval(function () label.setAttribute('value', time()), 100);
            },
            d: function (label) {
                return setInterval(function () label.setAttribute('value', day()), 60 * 1000);
            },
            y: function (label) {
                return setInterval(function () label.setAttribute('value', year()), 60 * 1000);
            },
        },

        generator: {
            t: function (self) {
                let l = self._master.cloneNode(false);
                l.setAttribute('id', self._constants.prefix + 'clock');
                l.setAttribute('value', time());
                let id = self._constants.driver.t(l);
                return {
                    node: l,
                    intervalId: id,
                };
            },
            d: function (self) {
                let l = self._master.cloneNode(false);
                l.setAttribute('id', self._constants.prefix + 'day');
                l.setAttribute('value', day());
                let id = self._constants.driver.d(l);
                return {
                    node: l,
                    intervalId: id,
                };
            },
            y: function (self) {
                let l = self._master.cloneNode(false);
                l.setAttribute('id', self._constants.prefix + 'year');
                l.setAttribute('value', year());
                let id = self._constants.driver.y(l);
                return {
                    node: l,
                    intervalId: id,
                };
            },
            raw: function (self, str) {
                let l = self._master.cloneNode(false);
                l.setAttribute('class', self._constants.prefix + 'raw');
                l.setAttribute('value', str);
                return {
                    node: l,
                };
            },
        },
    },

    // generate
    generate: function () {
        let box = window.document.createElement('hbox');
        box.setAttribute('id', this._constants.prefix + 'box');
        let format = this._format;
        let generator = this._constants.generator;

        let raw = '';
        let formatFlag = false;
        for (let i=0, l=format.length ; i<l ; ++i) {
            let c = format[i];
            switch(c) {
                case '%':
                    formatFlag = true;
                    if (raw) {
                        box.appendChild(generator['raw'](this, raw).node);
                        raw = '';
                    }
                    break;
                default:
                    if (formatFlag) {
                        if (c in generator) {
                            let g = generator[c](this);
                            box.appendChild(g.node);
                            if (g.intervalId) this._intervalInfo[c] = g;
                        }
                        formatFlag = false;
                    }
                    else {
                        raw += c;
                    }
                    break;
            }
        }
        if (raw.length > 0) box.appendChild(generator['raw'](this, raw).node);

        this._box = box;
    },

    get instance() this._box,
    hide:   function () this._box.setAttribute('style', 'display: none;'),
    appear: function () this._box.setAttribute('style', 'display: block;'),
    start: function () {
        let info = this._intervalInfo;
        for (let [k, i] in Iterator(info)) {
            if (!i.intervalId) {
                i.intervalId = this._constants.driver[k](i.node);
            }
        }
    },
    stop: function () {
        let info = this._intervalInfo;
        for (let [k, i] in Iterator(info)) {
            if (i.intervalId) {
                clearInterval(i.intervalId);
                i.intervalId = undefined;
            }
        }
    },
};


// main ---
let insertBase = window.document.getElementById(position);
if (!insertBase) {
    let errmsg = 'clock.js: not found the element that id is "' + position + '". check variable clock_position.';
    liberator.log(errmsg, 0);
    liberator.echoerr(errmsg, 0);
}

let clock = new Clock(format);
clock.generate();

// appendChild
after
    ? insertNodeAfterSpecified(clock.instance, insertBase)
    : insertNodeBeforeSpecified(clock.instance, insertBase);

// register command
[
    [['clockhide'],   'hide clock',   function () clock.hide(), ],
    [['clockappear'], 'clock appear', function () clock.appear(), ],
    [['clockstart'],  'start clock',  function () clock.start(), ],
    [['clockstop'],   'stop clock',   function () clock.stop(), ],
].forEach( function ([names, desc, func]) commands.addUserCommand(names, desc, func, {}) );


// stuff functions ---
function time() {
    let now = new Date();
    let hour = now.getHours().toString(10);
    let min  = now.getMinutes().toString(10);
    if (hour.length < 2) hour = '0' + hour;
    if (min.length < 2)  min  = '0' + min;
    return hour + (now.getMilliseconds() < 400 ? ' ' : ':') + min;
}
function day() {
    let now = new Date();
    let date  = now.getDate().toString(10);
    let month = (now.getMonth() + 1).toString(10);
    if (date.length < 2)  date  = '0' + date;
    if (month.length < 2) month = '0' + month;
    return month + '/' + date;
}
function year() {
    return new Date().getFullYear().toString(10);
}

// node control
function insertNodeBeforeSpecified(inserted, specified) {
    return specified.parentNode.insertBefore(inserted, specified);
}
function insertNodeAfterSpecified(inserted, specified) {
    var next = specified.nextSibling;
    if(next) {
        return specified.parentNode.insertBefore(inserted, next);
    }
    else {
        return specified.parentNode.appendChild(inserted);
    }
}
} )();

// vim: set sw=4 ts=4 et;
