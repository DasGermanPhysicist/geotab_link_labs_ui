import { geotab_sso_login, isAuthenticated } from "./lib/auth";
import { GeotabAPI, GeotabSession, GeotabLifecycleMethods, CallbackFunction } from "./lib/geotab";


async function ensure_linklabs_authorization(geotabAPI: GeotabAPI, addInReady: CallbackFunction) {
    const callAddInReady = () => {
        if (addInReady) {
            // console.log("Calling Add-In Ready...")
            addInReady()
        }
    }
    if (isAuthenticated()) {
        // Nothing to do, user is authenticated.
        callAddInReady();
        return;
    }
    geotabAPI.getSession(
        (session: GeotabSession) => {
            // console.log("session:")
            // console.dir(session, { depth: null, colors: true });

            try {
                geotab_sso_login(session).then(
                    (successfully_authenticated) => {
                        if (successfully_authenticated) {
                            // console.log('Successfully authenticated with Geotab SSO.');
                        } else {
                            console.warn('Failed to authenticate with Geotab SSO.');
                        }
                        callAddInReady();
                    }
                );
            } catch (error) {
                console.error('Unexpected error authenticating to Link Labs:', error);
            }
        },
        false
    );
}

export const GeotabLifecycle = (): GeotabLifecycleMethods => {
    // https://developers.geotab.com/myGeotab/addIns/developingAddIns#geotab-add-in-page-life-cycle

    return {
        initialize(api, _state, addInReady) {
            // console.log("Geotab Initialize Lifecycle: Airfinder Add-In");
            ensure_linklabs_authorization(api, addInReady);

            // NOTE: It's important to call the callback passed into initialize after all work is complete.
            // Keep in mind the asynchronous nature of JavaScript. The optional focus and blur methods will
            // be called due to the callback method being called in the initialize method.
            // addInReady();
        },

        focus(/* _api, _state */) {
            // console.log("Geotab Focus Lifecycle: Airfinder Add-In");
            // ensure_conductor_authorization(api);
            // TODO: ensure token is still valid?
        },
        
        blur(/* _api, _state */) {
            // console.log("Geotab Blur Lifecycle: Airfinder Add-In");
            // console.dir(api, { depth: null, colors: true });
            // console.dir(state, { depth: null, colors: true });
        }
    };
};
