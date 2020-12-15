import CookieControl from './components/CookieControl';
import CookieIframe from './components/CookieIframe';

const install = (Vue, _options) => {

    const defaultOptions = {
        ..._options.cookies,
        css: true,
        controlButton: true,
        barPosition: 'bottom-full',
    }

    const options = Object.assign({},defaultOptions,_options.options)

    let cookies = {
        modal: false,
        consent: false,
        enabled: [],
        enabledList: [],
        optional: []
    }

    Object.assign(cookies, options);

    if (options.colors !== false) {
        cookies.colors = {
            barTextColor: '#fff',
            modalOverlay: '#000',
            barBackground: '#000',
            barButtonColor: '#000',
            modalTextColor: '#000',
            modalBackground: '#fff',
            modalOverlayOpacity: 0.8,
            modalButtonColor: '#fff',
            modalUnsavedColor: '#fff',
            barButtonHoverColor: '#fff',
            barButtonBackground: '#fff',
            modalButtonHoverColor: '#fff',
            controlButtonIconColor: '#000',
            modalButtonBackground: '#000',
            controlButtonBackground: '#fff',
            barButtonHoverBackground: '#333',
            checkboxActiveBackground: '#000',
            controlButtonIconHoverColor: '#fff',
            checkboxInactiveBackground: '#000',
            modalButtonHoverBackground: '#333',
            checkboxDisabledBackground: '#ddd',
            controlButtonHoverBackground: '#000',
            checkboxActiveCircleBackground: '#fff',
            checkboxInactiveCircleBackground: '#fff',
            checkboxDisabledCircleBackground: '#fff',
        };
        Object.assign(cookies.colors, options.colors);
    }

    let methods = {
        get: (cookie) => {
            let decodedCookie = decodeURIComponent(document.cookie);
            let ca = decodedCookie.split(';');
            let name = `${cookie}=`;
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return '';
        },

        set: ({name, value = '', expires = '', path = '/', domain}) => {
            let domainName = domain ? domain : cookies.domain ? `.${cookies.domain}` : domain;
            document.cookie = `${name}=${value};expires=${expires};path=${path}${domainName !== undefined ? `;domain=${domainName}` : ';'}`;
        },

        isEnabled: (identifier) => {
            return cookies.enabledList.includes(identifier) || cookies.enabledList.includes(cookies.slugify(identifier))
        },


        slugify: (str) => {
            str = str.replace(/^\s+|\s+$/g, '');
            str = str.toLowerCase();
            let from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
            let to = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
            for (let i = 0, l = from.length; i < l; i++) {
                str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
            }

            str = str.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

            return str;
        },

        remove: (name) => {
            let domain = window.location.hostname;
            cookies.set({name, expires: 'Thu, 01 Jan 1970 00:00:00 GMT', domain});
            for (let j = domain.split('.'); j.length;) {
                let o = j.join('.');
                cookies.set({name, expires: 'Thu, 01 Jan 1970 00:00:00 GMT', domain: `.${o}`});
                j.shift();
            }
        },

        setConsent: (isInit = false) => {
            cookies.consent = cookies.get('cookie_control_consent') === 'true' ? true : false;
            cookies.enabled = [];
            cookies.enabledList = [];
            if (cookies.consent === true) {
                let enabledFromCookie = cookies.get('cookie_control_enabled_cookies');
                cookies.enabled.push(...cookies.optional.filter(c => {
                    let cookieName = typeof (c.name) === 'string' ? c.name : c.name[Object.keys(c.name)[0]]
                    return enabledFromCookie.includes(c.identifier || cookies.slugify(cookieName))
                }));
                cookies.enabledList = cookies.enabled.length > 0 ? cookies.enabled.map(c => {
                    let cookieName = typeof (c.name) === 'string' ? c.name : c.name[Object.keys(c.name)[0]]
                    return c.identifier || cookies.slugify(cookieName)
                }) : [];
            }

            if (cookies.necessary) cookies.enabled.push(...cookies.necessary.filter(c => {
                return c.src || c.accepted
            }))

            if (!isInit) {
                setHead();
                clearCookies();
                callAcceptedFunctions();
            }
        }
    }

    Object.assign(cookies, methods);

    const clearCookies = () => {
        let disabled = cookies.optional.filter(c => {
            let cookieName = typeof (c.name) === 'string' ? c.name : c.name[Object.keys(c.name)[0]]
            return !cookies.enabledList.includes(c.identifier || cookies.slugify(cookieName))
        });
        if (disabled.length > 0) {
            disabled.forEach(c => {
                if (c.declined) c.declined();
                if (c.cookies && c.cookies.length > 0) {
                    c.cookies.forEach(i => {
                        cookies.remove(i);
                    })
                }
            })
        }
    }

    const setHead = () => {
        if (cookies.enabled.length > 0) {
            let head = document.getElementsByTagName('head')[0];
            cookies.enabled.forEach(c => {
                if (c.src) {
                    let script = document.createElement('script');
                    script.src = c.src;
                    head.appendChild(script);
                    script.addEventListener('load', () => {
                        if (c.accepted) c.accepted();
                    })
                }
            })
        }
    }

    const callAcceptedFunctions = () => {
        if (cookies.enabled.length > 0) {
            cookies.enabled.forEach(c => {
                if (c.accepted) c.accepted();
            })
        }
    }

    cookies.setConsent(true)

    setTimeout(() => {
        cookies.setConsent()
    },500)

    if (cookies.blockIframe) Vue.component('CookieIframe', CookieIframe);
    Vue.component('CookieControl', CookieControl);
    Vue.prototype.$cookies = cookies;
 
}


export default {
    install
}

