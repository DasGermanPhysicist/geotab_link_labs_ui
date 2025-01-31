interface GeotabAPI {
    // Define the properties and methods available on the Geotab API object
}

interface PageState {
    /**
     * Gets an object that represents the current URL state.
     * @returns An object representing the current URL state.
     */
    getState(): object;

    /**
     * Sets the current URL state.
     * @param state - The state object to set, typically modified from getState.
     */
    setState(state: object): void;

    /**
     * Redirects the user to another page with optional parameters.
     * @param pageName - The name of the page to navigate to.
     * @param parameters - Optional query string parameters for the page.
     */
    gotoPage(pageName: string, parameters?: object): void;

    /**
     * Checks whether the current user has the security clearance to view a page by its hash value.
     * @param pageHash - The hash value of the page to check access for.
     * @returns True if the user has access, otherwise false.
     */
    hasAccessToPage(pageHash: string): boolean;

    /**
     * Gets an array with IDs of the selected groups in the organization filter.
     * @returns An array of group IDs.
     */
    getGroupFilter(): string[];

    /**
     * Gets an object with a relation property and a groupFilterConditions array of the selected groups in the organization filter.
     * @returns An object containing the relation and group filter conditions.
     */
    getAdvancedGroupFilter(): { relation: string, groupFilterConditions: any[] };
}

type CallbackFunction = () => void;


interface GeotabLifecycleMethods {
    /**
     * Called only once when your custom page is first accessed.
     * Use this method to initialize variables required by your Add-In.
     * 
     * @param api - The Geotab API object.
     * @param state - The current page state.
     * @param callback - A function to call once initialization is complete.
     */
    initialize(api: GeotabAPI, state: PageState, callback: CallbackFunction): void;

    /**
     * This method is called after the user interface has loaded or the state of the organization filter is changed.
     * Use this method for initial interactions with the user or elements on the page.
     * 
     * @param api - The Geotab API object.
     * @param state - The current page state.
     */
    focus(api: GeotabAPI, state: PageState): void;

    /**
     * This method is called when the user is navigating away from your page.
     * Use this method to save any required state.
     * 
     * @param api - The Geotab API object.
     * @param state - The current page state.
     */
    blur(api: GeotabAPI, state: PageState): void;
}

export const GeotabLifecycle = (): GeotabLifecycleMethods => {
    // https://developers.geotab.com/myGeotab/addIns/developingAddIns#geotab-add-in-page-life-cycle

    return {
        initialize(api, state, callback) {
            console.log("start initialize")
            // console.dir(api, { depth: null, colors: true });
            // console.dir(state, { depth: null, colors: true });
        
            // NOTE: It's important to call the callback passed into initialize after all work is complete.
            // Keep in mind the asynchronous nature of JavaScript. The optional focus and blur methods will
            // be called due to the callback method being called in the initialize method.
            callback();
        },

        focus(api, state) {
            console.log("start focus")
            // console.dir(api, { depth: null, colors: true });
            // console.dir(state, { depth: null, colors: true });
        },
        
        blur(api, state) {
            console.log("start blur")
            // console.dir(api, { depth: null, colors: true });
            // console.dir(state, { depth: null, colors: true });
        }
    };
};
