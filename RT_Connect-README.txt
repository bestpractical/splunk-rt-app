RT Connect
==========

RT Connect is a Splunk app that allows you to call the RT or RTIR REST API
with data from triggered Splunk alerts.

RT Configuration
================

RT Connect assumes the following RTIR configuration:

* RT Connect uses RT's REST2 API with tokens. These two features are available
as free extensions:

    - RT::Extension::REST2 https://metacpan.org/pod/RT::Extension::REST2
    - RT::Authen::Token https://metacpan.org/pod/RT::Authen::Token

* An RT user account with sufficient rights to create tickets and set custom
fields.

Once the extensions above are installed, create an RT user account that can
be used for the connection from Splunk. The user should have rights to
create tickets in the Incident Reports queue and set custom fields.
The user will also need the ModifySelf and ManageAuthTokens rights. These
can be granted to groups or users in Admin > Global > Group Rights on the
Staff tab.

While logged in as the new Splunk user, you can create a token at
Logged in as > Settings > Auth Tokens. Copy the new token for used when
setting up the Splunk integration.

* The RTIR REST interface must be accessible from the Splunk server.

Splunk Configuration
====================

This app has been tested on Splunk version 7.3.

* The core alert is run by a Perl program in rt_connect/bin/rt_connect.
By default this uses the system perl in /usr/bin/perl. After installation
you can update the #! line for a perl in a different location, if needed.

* The Perl program uses a module called "JSON" for JSON parsing. This is not a
core module, so you will need to install it either via your Linux packaging
system or manually.

* If your RT system is accessible through https, you also need to install the
IO::Socket::SSL module.

* Log into Splunk as an administrator and install the app from the tar file.

* Click the gearbox next to Apps or select Apps > Manage apps from the menu.

* Click on Install from file and locate the RT_Connect tar.gz file. Note that
Splunk may prompt you to restart after installing, so the app should be
installed at a time when Splunk can be restarted.

* When prompted, add connection details for your RTIR instance:

    Server Base URL: https://<your.server>/REST/2.0/
    API Token: The token you created above in RTIR.

* You can now create a new Splunk alert and select rt_connect as the action.
The details for the ticket to be created are available in the set-up screen
including the queue (by Id), Requestor, Subject, email content, and custom
fields. You can use Splunk variables for any of these fields.

Adding a custom field
=====================

in /opt/splunk/etc/apps/rt_connect

1 - add the field in the UI
  in default/data/ui/alerts/rt_connect.html
  add a <div class="control-group"> stanza, by copying an existing one and
  changing the parameter name, id and default value

  ex:
    <div class="control-group">
        <label class="control-label" for="rt_hostname">Hostname</label>
        <div class="controls">
            <input type="text" name="action.rt_connect.param.rt_hostname" id="rt_hostname" value="$result.hostname$"></input>
            <span class="help-block">
                Default: the <tt>hostname</tt> field.
            </span>
        </div>
    </div>

  the id/parameter name is the custom field name, lower cased and with spaces replaced by underscores, ie 'MAC Address' becomes 'mac_address'.

2 -  add the mapping between custom field name and RT id

  in bin/rt_connect

  in %cf_name_to_id add a line '<CF Name>' => <id>

  ex:
    'Hostname' => 23,

