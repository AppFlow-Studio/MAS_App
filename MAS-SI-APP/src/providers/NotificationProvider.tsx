import { registerForPushNotificationsAsync } from '../lib/notifications';
import { ExpoPushToken, NotificationTriggerInput } from 'expo-notifications';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { format } from 'date-fns';
export type PrayerNotificationTemplateProp = {
  prayer_name : string
  hour : number
  minute : number
  body : string
  title : string
}
Notifications.setNotificationHandler({
  handleNotification : async () =>({
    shouldShowAlert : true,
    shouldPlaySound : false,
    shouldSetBadge : false
  })
})

const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState<
    ExpoPushToken | undefined
  >();
  const { session } = useAuth()
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  console.log('session',session?.user.id)

  const savePushToken = async ( newToken : ExpoPushToken | undefined ) => {
    console.log('called savePushToken')
    console.log('newToken', newToken)
    setExpoPushToken(newToken)
    if( !newToken ){
      return;
    }
    if( session?.user.id ){
      console.log('session exits')
    }
    else{
      console.log('session fail')
    }
    const { error } = await supabase.from('profiles').update({  push_notification_token : newToken }).eq('id', session?.user.id)
    if( error ){
      console.log('error', error)
    }
  }

  async function PrayerNotificationTemplate({prayer_name, hour, minute, body, title} : PrayerNotificationTemplateProp ){
    const trigger = new Date()
    trigger.setHours(hour)
    trigger.setMinutes(minute)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { data: 'goes here', test: { test1: 'more data' } },
      },
      trigger
    });
  }

  async function scheduleProgramPushNotifications(){
    const { data : userAddedPrograms, error : addedProgramsError } = await supabase.from('added_notifications_programs').select('*').eq('user_id', session?.user.id)
    const { data : userProgramSettings, error : userSettingsError } = await supabase.from('program_notifications_settings').select('*').eq('user_id', session?.user.id)

    userAddedPrograms?.map((AddedProgram) => {
      userProgramSettings?.map((ProgramSettings) => {
        if(AddedProgram.program_id == ProgramSettings.program_id){
          ProgramSettings.notification_settings.map( async (setting) => {
            if( setting == 'When Program Starts'){
              const program_time = await supabase.from('programs').select('program_start_time, program_days').eq('program_id', AddedProgram.program_id).single()
              const currentDate = new Date()
              const dayOfWeek = format(currentDate, 'EEEE')
              if( program_time.data?.program_days.includes(dayOfWeek)){
                const timeProgramStart = program_time.data.program_start_time
                const timeDate = new Date(timeProgramStart)
                console.log(timeDate)
              }
            }
          })
        }
      })
    })

  }


  async function schedulePrayerPushNotifications() {
    const { data : todays_prayers , error } = await supabase.from('todays_prayers').select('*')
    const { data : user_prayer_settings, error : user_setting_error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id)
    todays_prayers?.map((prayer) => {
      user_prayer_settings?.map((setting) => {
        if(setting.prayer == prayer.prayer_name || (prayer.prayer_name == 'zuhr' && setting.prayer == 'dhuhr')){
          console.log(prayer.prayer_name, setting.notification_settings)

            setting.notification_settings.map(( choice ) => {
              if( choice == 'Alert at Athan time' ){
                const date = new Date(prayer.athan_time);
                // Get the hours and minutes
                const hours = date.getHours()
                const minutes = date.getMinutes()

                PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `${setting.prayer} at ${prayer.athan_time}`, body : 'Time to pray!'}, )
                console.log('Schedule at', prayer.athan_time)
              }else if( choice == 'Alert at Iqamah time'){
                const date = new Date(prayer.athan_time);
                // Get the hours and minutes
                const hours = date.getHours()
                const minutes = date.getMinutes()
                PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `Iqamah ${setting.prayer} at ${prayer.iqamah_time}`, body : 'Time to pray!'}, )
                console.log('Schedule at', prayer.iqamah_time)
              }else if( choice == 'Alert 30 mins before next prayer' ){
                if( setting.prayer == 'fajr' ){
                  const nextPrayerInfo = todays_prayers.filter(e => e.prayer_name == 'zuhr')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const date = new Date(nextPrayerTime);
                 // Subtract 30 minutes (30 * 60 * 1000 milliseconds)
                  date.setTime(date.getTime() - 30 * 60 * 1000);

                  // Get the updated timestamp in ISO format (with timezone info)
                  const hours = date.getHours()
                  const minutes = date.getMinutes()
                  PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `30 mins before ${nextPrayerInfo[0].prayer_name}`, body : 'Time to pray!'}, )

                }
                if( setting.prayer == 'dhuhr' ){
                  const nextPrayerInfo = todays_prayers.filter(e => e.prayer_name == 'asr')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const date = new Date(nextPrayerTime);
                 // Subtract 30 minutes (30 * 60 * 1000 milliseconds)
                  date.setTime(date.getTime() - 30 * 60 * 1000);

                  // Get the updated timestamp in ISO format (with timezone info)
                  const hours = date.getHours()
                  const minutes = date.getMinutes()
                  PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `30 mins before ${nextPrayerInfo[0].prayer_name}`, body : 'Time to pray!'}, )

                }
                if( setting.prayer == 'asr' ){
                  const nextPrayerInfo = todays_prayers.filter(e => e.prayer_name == 'maghrib')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const date = new Date(nextPrayerTime);
                 // Subtract 30 minutes (30 * 60 * 1000 milliseconds)
                  date.setTime(date.getTime() - 30 * 60 * 1000);
                  const hours = date.getHours()
                  const minutes = date.getMinutes()
                  // Get the updated timestamp in ISO format (with timezone info)
                  PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `30 mins before ${nextPrayerInfo[0].prayer_name}`, body : 'Time to pray!'}, )

                }
                if( setting.prayer == 'maghrib' ){
                  const nextPrayerInfo = todays_prayers.filter(e => e.prayer_name == 'isha')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const date = new Date(nextPrayerTime);
                 // Subtract 30 minutes (30 * 60 * 1000 milliseconds)
                  date.setTime(date.getTime() - 30 * 60 * 1000);

                  const hours = date.getHours()
                  const minutes = date.getMinutes()
                  // Get the updated timestamp in ISO format (with timezone info)
                  PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `30 mins before ${nextPrayerInfo[0].prayer_name}`, body : 'Time to pray!'}, )

                }
                if( setting.prayer == 'isha' ){
                  const nextPrayerInfo = todays_prayers.filter(e => e.prayer_name == 'fajr')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const date = new Date(nextPrayerTime);
                 // Subtract 30 minutes (30 * 60 * 1000 milliseconds)
                  date.setTime(date.getTime() - 30 * 60 * 1000);

                  const hours = date.getHours()
                  const minutes = date.getMinutes()
                  // Get the updated timestamp in ISO format (with timezone info)
                  PrayerNotificationTemplate({ prayer_name : setting.prayer, hour : hours, minute : minutes, title : `30 mins before ${nextPrayerInfo[0].prayer_name}`, body : 'Time to pray!'}, )
                }
              }else if( choice == 'Mute'){
                return
              }
          })
        }
      })
    })

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You've got mail! 📬",
        body: 'Here is the notification body',
        data: { data: 'goes here', test: { test1: 'more data' } },
      },
      trigger: { seconds: 2 },
    });
    }

  useEffect(() => {
    registerForPushNotificationsAsync().then( (token : any) => savePushToken(token) );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('response', response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };

    schedulePushNotification()
  }, []);

  console.log('noti', notification);
  console.log(expoPushToken);

  return <>{children}</>;
};

export default NotificationProvider;