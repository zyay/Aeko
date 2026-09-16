package com.zyay.lyan.notify

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat

object ActivityNotify {
    fun show(context: Context, task: String) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(
                NotificationChannel("lyan_activity", "Task activity", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        val n = NotificationCompat.Builder(context, "lyan_activity")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Lyan")
            .setContentText("New activity in $task")
            .setAutoCancel(true)
            .build()
        nm.notify(task.hashCode(), n)
    }
}
