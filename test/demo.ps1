(Get-Process -Id $pid).PriorityClass = 'High'
$Version = $PSVersionTable.PSVersion
if($Version.Major -gt 7 -or ($Version.Major -eq 7 -and $Version.Minor -ge 1)){
  $Assemblies = @(
    [pscustomobject]@{name = 'Microsoft.Windows.SDK.NET.Ref';version = '10.0.20348.20';files = @('lib\WinRT.Runtime.dll';'lib\Microsoft.Windows.SDK.NET.dll')}
  )
  ForEach ($Lib in $Assemblies){
    if (!(Get-Package -Name $Lib.name -ErrorAction SilentlyContinue)){
      Install-Package -Name $Lib.name -MinimumVersion $Lib.version -ProviderName NuGet -Source 'https://www.nuget.org/api/v2' -Force -Scope CurrentUser
    }
    ForEach ($File in $Lib.files) {
      $Source = Split-Path -Path (Get-Package -Name $Lib.name | Select-Object Source).Source
      $FilePath = Join-Path -Path $Source -ChildPath $File
      Add-Type -Path $FilePath -ErrorAction Stop
    }
  }
}else{
  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
}
$APP_ID = 'Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp'
$template = @"
<toast displayTimestamp="2019-09-17T09:02:04.000Z" activationType="protocol" scenario="default" launch="bingmaps:?q=sushi" duration="Short"><header id="id1" title="group" arguments="" /><visual><binding template="ToastGeneric"><image placement="appLogoOverride" src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg" hint-crop="circle"/><image placement="hero" src="D:\Documents\GitHub\xan105\node-powertoast\screenshot\example.png"/><text><![CDATA[Dummy]]></text><text><![CDATA[Hello World]]></text><text placement="attribution"><![CDATA[Achievement]]></text><image src="" /><progress title="up" value="0.00" valueStringOverride="" status="down"/></binding></visual><actions><action content="1" placement="" imageUri="" arguments="bingmaps:?q=sushi" activationType="protocol"/><action content="2" placement="contextMenu" imageUri="" arguments="bingmaps:?q=sushi" activationType="protocol"/><action content="3" placement="" imageUri="" arguments="bingmaps:?q=sushi" activationType="protocol"/><action content="4" placement="" imageUri="" arguments="bingmaps:?q=sushi" activationType="protocol"/><action content="5" placement="" imageUri="" arguments="bingmaps:?q=sushi" activationType="protocol"/></actions><audio silent="false" src="ms-winsoundevent:Notification.Achievement"/></toast>
"@
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = New-Object Windows.UI.Notifications.ToastNotification $xml
$Toast.Data = [Windows.UI.Notifications.NotificationData]::new()
$toast.Data.SequenceNumber = 0
$toast.Tag = "id0"
$toast.Group = "id0"
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)