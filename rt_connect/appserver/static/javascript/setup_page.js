"use strict";

const appName = "rt_connect";
const appNamespace = {
    owner: "nobody",
    app: appName,
    sharing: "app",
};

// Splunk Web Framework Provided files
require([
    "jquery", "splunkjs/splunk",
], function($, splunkjs) {
    console.log("setup_page.js require(...) called");

    // Fetch and load existing configuration values
    loadConfigValues();

    // Register .on("click", handler) for "Complete Setup" button
    $("#setup_button").click(completeSetup);

    // Function to fetch existing configuration values
    async function loadConfigValues() {
        let stage = 'Initializing the Splunk SDK for Javascript';
        try {
            // Initialize a Splunk Javascript SDK Service instance
            const http = new splunkjs.SplunkWebHttp();
            const service = new splunkjs.Service(http, appNamespace);

            // Fetch the configurations
            stage = 'Retrieving configurations SDK collection';
            const configCollection = service.configurations(appNamespace);
            await configCollection.fetch();
            const alertActionsConf = configCollection.item('alert_actions');
            await alertActionsConf.fetch();
            const rtConnectStanza = alertActionsConf.item('rt_connect');

            if (rtConnectStanza) {
                await rtConnectStanza.fetch();
                const configProps = rtConnectStanza.properties();

                // Populate input fields with existing values
                $('#base_url_input').val(configProps['param.base_url'] || '');
                $('#auth_token_input').val(configProps['param.auth_token'] || '');
            }
        } catch (e) {
            console.warn(e);
            $('.error').show();
            $('#error_details').show();
            let errText = `Error encountered during stage: ${stage}<br>`;
            errText += (e.toString() === '[object Object]') ? '' : e.toString();
            if (e.hasOwnProperty('status')) errText += `<br>[${e.status}] `;
            if (e.hasOwnProperty('responseText')) errText += e.responseText;
            $('#error_details').html(errText);
        }
    }

    // onclick function for "Complete Setup" button from setup_page_dashboard.xml
    async function completeSetup() {
        console.log("setup_page.js completeSetup called");

        const baseUrlToSave = $('#base_url_input').val();
        const authTokenToSave = $('#auth_token_input').val();
        let stage = 'Initializing the Splunk SDK for Javascript';

        try {
            // Initialize a Splunk Javascript SDK Service instance
            const http = new splunkjs.SplunkWebHttp();
            const service = new splunkjs.Service(http, appNamespace);

            // Get app.conf configuration
            stage = 'Retrieving configurations SDK collection';
            const configCollection = service.configurations(appNamespace);
            await configCollection.fetch();
            stage = `Retrieving app.conf values for ${appName}`;
            const appConfig = configCollection.item('app');
            await appConfig.fetch();
            stage = `Retrieving app.conf [install] stanza values for ${appName}`;
            const installStanza = appConfig.item('install');
            await installStanza.fetch();

            // Verify that app is not already configured
            const isConfigured = installStanza.properties().is_configured;
            if (isTrue(isConfigured)) {
                console.warn(`App is configured already (is_configured=${isConfigured}), skipping setup page...`);
                reloadApp(service);
                redirectToApp();
            }

            // Save configuration values
            stage = 'Saving configuration values';
            await saveConfigValue(service, 'base_url', baseUrlToSave);
            await saveConfigValue(service, 'auth_token', authTokenToSave);

            // Set app as configured
            stage = 'Setting app.conf [install] is_configured = 1';
            await installStanza.update({ is_configured: 1 });

            // Reload app to apply changes
            stage = `Reloading app ${appName} to register is_configured = 1 change`;
            await reloadApp(service);

            $('.success').show();
            stage = 'Redirecting to app home page';
            redirectToApp();
        } catch (e) {
            console.warn(e);
            $('.error').show();
            $('#error_details').show();
            let errText = `Error encountered during stage: ${stage}<br>`;
            errText += (e.toString() === '[object Object]') ? '' : e.toString();
            if (e.hasOwnProperty('status')) errText += `<br>[${e.status}] `;
            if (e.hasOwnProperty('responseText')) errText += e.responseText;
            $('#error_details').html(errText);
        }
    }

    async function saveConfigValue(service, key, value) {
        const configCollection = service.configurations(appNamespace);
        await configCollection.fetch();
        const alertActionsConf = configCollection.item('alert_actions');
        await alertActionsConf.fetch();
        const rtConnectStanza = alertActionsConf.item('rt_connect');
        if (rtConnectStanza) {
            await rtConnectStanza.update({ [`param.${key}`]: value });
        } else {
            await alertActionsConf.createStanza('rt_connect');
            const newRtConnectStanza = alertActionsConf.item('rt_connect');
            await newRtConnectStanza.update({ [`param.${key}`]: value });
        }
    }

    async function reloadApp(service) {
        const apps = service.apps();
        await apps.fetch();
        const app = apps.item(appName);
        await app.fetch();
        await app.reload();
    }

    function redirectToApp() {
        setTimeout(() => {
            window.location.href = `/`;
        }, 800); // wait 800ms and redirect
    }

    function isTrue(v) {
        if (typeof(v) === typeof(true)) return v;
        if (typeof(v) === typeof(1)) return v !== 0;
        if (typeof(v) === typeof('true')) {
            if (v.toLowerCase() === 'true') return true;
            if (v === 't') return true;
            if (v === '1') return true;
        }
        return false;
    }
});
