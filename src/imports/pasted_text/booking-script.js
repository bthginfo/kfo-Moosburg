(function() {
    var a = {
        medicalPracticeId: "46546",
        baseAddress: 'https://dr-flex.de',
        winlocalId: '',
        applicationPath: function(n) {
            if (n)
                return "https://dr-flex.de/embed?medicalPracticeId=46546".replace('MEDICALPRACTICEIDPLACEHOLDER', n);
            else
                return "https://dr-flex.de/embed?medicalPracticeId=46546"
        }
    };
    var b = null;
    function c() {
        try {
            if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
                const n = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
                if (n instanceof WebAssembly.Module)
                    return new WebAssembly.Instance(n)instanceof WebAssembly.Instance
            } else {
                return false
            }
        } catch (n) {
            return false
        }
    }
    function d() {
        var n = 0
          , o = 0;
        if (typeof window.innerWidth === 'number') {
            n = window.innerWidth;
            o = window.innerHeight
        } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
            n = document.documentElement.clientWidth;
            o = document.documentElement.clientHeight
        } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
            n = document.body.clientWidth;
            o = document.body.clientHeight
        }
        ;return {
            width: n,
            height: o
        }
    }
    function e() {
        if (d().width < 768) {
            return true
        }
        ;let n = false;
        (function(o) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(o) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(o.substr(0, 4)))
                n = true
        }
        )(navigator.userAgent || navigator.vendor || window.opera);
        return n
    }
    var f = function(n) {
        try {
            return n instanceof HTMLElement
        } catch (o) {
            return typeof n === "object" && n.nodeType === 1 && typeof n.style === "object" && typeof n.ownerDocument === "object"
        }
    };
    var g = function(n) {
        var o = f(n);
        if (!o) {
            throw "'targetElement' must be an dom node, got '" + n + "'"
        }
    };
    window.addEventListener("message", function(n) {
        if (n.origin !== a.baseAddress)
            return;
        var o = n.data;
        var p = JSON.parse(o);
        if (!(typeof b === "function")) {
            if (typeof window.ga === "function") {
                window.ga("send", "event", "Terminbuchung", p.eventAction, p.eventLabel + ' ' + p.consultation + ' ' + p.therapist + ' ' + p.practiceName)
            }
            ;if (typeof window.gtag === "function") {
                window.gtag('event', p.eventAction, {
                    'event_category': "Terminbuchung",
                    'event_label': p.eventLabel,
                    'value': p.consultation + ' ' + p.therapist + ' ' + p.practiceName
                })
            }
            ;if (typeof window.dataLayer !== 'undefined') {
                var q = {
                    'event': 'Terminbuchung',
                    'category': p.eventAction,
                    'lable': p.eventLabel,
                    'label': p.eventLabel,
                    'consultation': p.consultation,
                    'therapist': p.therapist,
                    'practiceName': p.practiceName,
                    'medicalPracticeId': p.medicalPracticeId,
                    'ordinalBookingId': p.ordinalBookingId,
                    'combinedOrdinalBookingIds': p.combinedOrdinalBookingIds
                };
                window.dataLayer.push(q)
            }
            ;if (typeof window.fbq === "function") {
                window.fbq('trackCustom', 'Terminbuchung', p)
            }
        }
        ;if (typeof b === "function") {
            b({
                'event': 'Terminbuchung',
                'category': p.eventAction,
                'label': p.eventLabel,
                'consultation': p.consultation,
                'therapist': p.therapist,
                'insuranceType': p.insuranceType,
                'practiceName': p.practiceName,
                'medicalPracticeId': p.medicalPracticeId,
                'ordinalBookingId': p.ordinalBookingId,
                'combinedOrdinalBookingIds': p.combinedOrdinalBookingIds
            })
        }
    }, false);
    var h = function(n) {
        var o = '';
        var p = '';
        var q = '';
        var r = [];
        var s = null;
        var t = false;
        var u = '';
        if (n.length > 0) {
            var v = 0;
            while (v < n.length) {
                var w = n[v];
                if (f(w) && v === 0) {
                    v++;
                    continue
                }
                ;if (w !== null && typeof w === 'object') {
                    {
                        var x = w['consultationFilter'];
                        if (x !== undefined && typeof x === 'string' && x !== '')
                            o = x
                    }
                    ;{
                        var y = w['therapistFilter'];
                        if (y !== undefined && typeof y === 'string' && y !== '')
                            p = y
                    }
                    ;{
                        var z = w['therapistIdFilter'];
                        if (z !== undefined && Array.isArray(z)) {
                            for (var A = 0; A < z.length; A++) {
                                if (typeof z[A] === 'string' && z[A] === parseInt(z[v]) + "")
                                    z[A] = parseInt(z[A]);
                                if (typeof z[A] !== 'number' || z[A] !== Math.round(z[A]))
                                    throw 'therapistIdFilter[' + A + ']) must be am int number'
                            }
                            ;s = z
                        } else if (z !== undefined && !Array.isArray(z)) {
                            throw 'therapistIdFilter must be an array'
                        }
                    }
                    ;{
                        var B = w['analyticsCallback'];
                        if (B !== undefined && typeof B === 'function')
                            b = B
                    }
                    ;{
                        var C = w['wlid'];
                        if (C !== undefined && typeof C === 'string' && C !== '')
                            u = C
                    }
                    ;{
                        var D = w['preselectedSlot'];
                        if (D !== undefined && typeof D === 'string' && D !== '')
                            q = D
                    }
                } else if (parseInt(w) + "" === w + "") {
                    r.push(parseInt(w));
                    t = true
                } else
                    throw "invalid argument on pos " + v + ": '" + w + "', need a number or object";
                v++
            }
        }
        ;if (t === false && typeof a.medicalPracticeId === 'string') {
            var E = a.medicalPracticeId.split('-');
            for (var v = 0; v < E.length; v++)
                r.push(parseInt(E[v]))
        }
        ;if (r.length === 0) {
            throw "need 'medicalPracticeId' as parameter in url or in function call"
        }
        ;var F = "";
        for (var G = 0; G < r.length; G++) {
            if (G > 0)
                F += "-";
            F += '' + r[G]
        }
        ;var H = '';
        if (s != null) {
            H = '&therapistIdFilter=';
            for (var I = 0; I < s.length; I++) {
                if (I > 0)
                    H += "-";
                H += '' + s[I]
            }
        }
        ;var J = '';
        try {
            J = encodeURIComponent(window.location.href)
        } catch (K) {
            try {
                J = escape(window.location.href)
            } catch (L) {}
        }
        ;return {
            medicalPracticeId: F,
            consultationFilter: o,
            therapistFilter: p,
            consultationFilterUrl: o !== '' ? '&consultationFilter=' + escape(o) : '',
            therapistFilterUrl: p !== '' ? '&therapistFilter=' + escape(p) : '',
            medicalPracticeIdArray: r,
            therapistIdFilter: s,
            therapistIdFilterUrl: H,
            winlocalId: u !== '' ? '&wlid=' + escape(u) : '',
            preselectedSlot: q,
            preselectedSlotUrl: q !== '' ? '&preselectedSlot=' + q : '',
            opn: '&opn=' + J
        }
    };
    var i = function() {
        try {
            return "&returnUrl=" + escape(window.location.href)
        } catch (n) {
            return ""
        }
    };
    var j = function() {
        function n(p) {
            return p.trim().substring(0, 2).toUpperCase()
        }
        var o = function() {
            try {
                var p = navigator.language || navigator.userLanguage;
                if (typeof p === 'string' || p instanceof String)
                    return n(p);
                return ""
            } catch (q) {
                return ""
            }
        };
        return o()
    };
    var k = function() {
        return "&lang=" + escape(j())
    };
    var l = function() {
        function n() {
            var r = 0
              , s = 0;
            if (typeof window.innerWidth === 'number') {
                r = window.innerWidth;
                s = window.innerHeight
            } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
                r = document.documentElement.clientWidth;
                s = document.documentElement.clientHeight
            } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
                r = document.body.clientWidth;
                s = document.body.clientHeight
            }
            ;return {
                width: r,
                height: s
            }
        }
        var o = 'closed';
        var p = null;
        var q = null;
        q = function() {
            if (e()) {
                var r = h(arguments);
                var s = a.applicationPath(r.medicalPracticeId) + r.consultationFilterUrl + r.therapistFilterUrl + r.therapistIdFilterUrl + r.preselectedSlotUrl + r.winlocalId + r.opn + k() + i();
                window.open(s, '_blank')
            } else {
                if (o === 'closed') {
                    var r = h(arguments);
                    var t = document.createElement("style");
                    t.textContent = "@keyframes drflex-spinner-rotate {0% {transform: rotate(0deg);}100% {transform: rotate(359deg);}}";
                    document.head.appendChild(t);
                    var u = document.createElement("div");
                    u.setAttribute("style", "height: " + n().height + "px; position: fixed; width: 100%; overflow: hidden; z-index: 2147483647; " + "margin: 0px; padding: 0px; top: 0; left: 0; background: rgba(0, 0, 0, 0.5);");
                    var v = document.createElement("div");
                    v.setAttribute("style", "height: " + n().height + "px; position: fixed; width: 100%; overflow: hidden;" + "top: 0; left: 0;");
                    u.appendChild(v);
                    var w = document.createElement("div");
                    w.setAttribute("style", "height: " + n().height + "px;position: fixed;width: 100%;top: 0;left: 0;animation: drflex-spinner-rotate 1s infinite;background-repeat: no-repeat;background-position: center;background-image: url(\"data:image/svg+xml;charset=utf8,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M20.828 1.14C17.69 0.12 14.31 0.12 11.172 1.14C8.033 2.159 5.299 4.146 3.359 6.816C1.42 9.485 0.375 12.7 0.375 16C0.375 19.3 1.42 22.515 3.359 25.184C5.298 27.853 8.033 29.84 11.171 30.86C14.309 31.88 17.69 31.88 20.828 30.86C23.966 29.841 26.701 27.854 28.641 25.185C30.58 22.515 31.625 19.3 31.625 16.001C31.625 15.383 31.124 14.882 30.507 14.882C29.889 14.882 29.388 15.383 29.388 16.001C29.388 18.828 28.493 21.583 26.831 23.87C25.169 26.157 22.826 27.859 20.137 28.733C17.448 29.607 14.551 29.606 11.863 28.733C9.174 27.859 6.831 26.156 5.169 23.869C3.507 21.582 2.612 18.827 2.612 16C2.612 13.173 3.507 10.418 5.169 8.131C6.831 5.843 9.174 4.141 11.863 3.267C14.552 2.394 17.448 2.394 20.137 3.267C20.724 3.458 21.355 3.137 21.546 2.549C21.737 1.962 21.416 1.331 20.828 1.14Z' fill='white'/%3E%3C/svg%3E\");");
                    v.appendChild(w);
                    u.setAttribute("id", "dr-flex-embed-holder");
                    var x = document.createElement("iframe");
                    x.setAttribute("style", "width: 100%; height: 100%; overflow: auto; display: none;" + " border: none; padding: 0; margin: 0; background: transparent;");
                    var y = '';
                    if (!c()) {
                        y = '&wasmSupport=false'
                    }
                    ;x.setAttribute('src', a.applicationPath(r.medicalPracticeId) + y + r.consultationFilterUrl + r.therapistFilterUrl + r.therapistIdFilterUrl + r.preselectedSlotUrl + r.winlocalId + r.opn + k());
                    x.setAttribute("id", "dr-flex-embed-frame");
                    x.setAttribute("name", "dr-flex-embed-frame");
                    u.appendChild(x);
                    document.body.insertBefore(u, document.body.firstChild);
                    o = 'intermediate';
                    var z = false;
                    x.addEventListener('load', function() {
                        if (!z) {
                            v.style.display = 'none';
                            u.style.backgroundImage = 'none';
                            z = true;
                            x.style.display = "block";
                            window.setTimeout(function() {
                                u.removeChild(v);
                                document.head.removeChild(t)
                            }, 1000)
                        } else {
                            q.apply(null, r)
                        }
                    }, false);
                    p = u
                } else if (o === 'intermediate') {
                    p.style.display = "none";
                    document.body.removeChild(p);
                    p = null;
                    o = 'closed'
                }
            }
        }
        ;
        window['toggleDrFlexAppointments'] = q;
        try {
            window.setTimeout(function() {
                if (window.location.href.toLowerCase().indexOf('drFlexInitiallyOpen'.toLowerCase()) !== -1 && a.medicalPracticeId)
                    q()
            }, 250)
        } catch (r) {}
    };
    var m = null;
    m = function() {
        try {
            l()
        } catch (n) {
            window.setTimeout(m, 1)
        }
    }
    ;
    m();
    window['loadDrFlexAppointments'] = function(n) {
        g(n);
        var o = h(arguments);
        window.___dr_flex_options = {
            "medicalPracticeIds": o.medicalPracticeIdArray,
            "returnUrlOption": null,
            "isMobile": e(),
            "initialLanguage": j(),
            "consultationFilter": o.consultationFilter !== '' ? [o.consultationFilter] : [],
            "therapistFilter": o.therapistFilter !== '' ? [o.therapistFilter] : [],
            "base": a.baseAddress,
            "inline": true,
            "el": n,
            "therapistIdFilter": o.therapistIdFilter,
            "winlocalId": o.winlocalId,
            "opn": o.opn
        };
        var p = document.createElement("script");
        p.setAttribute("src", a.baseAddress + "/embed-inline.js");
        try {
            scripts.setAttribute("async", "")
        } catch (t) {}
        ;document.body.appendChild(p);
        var q = [a.baseAddress + '/embed-inline.css', a.baseAddress + '/assets/stylesheets/roboto.css'];
        for (var r = 0; r < q.length; r++) {
            var s = document.createElement("link");
            s.setAttribute("rel", "stylesheet");
            s.setAttribute("type", "text/css");
            s.setAttribute("href", q[r]);
            document.head.appendChild(s)
        }
    }
}
)()
