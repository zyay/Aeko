package com.zyay.aeko.notify

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
                NotificationChannel("aeko_activity", "Task activity", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        val n = NotificationCompat.Builder(context, "aeko_activity")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Aeko")
            .setContentText("New activity in $task")
            .setAutoCancel(true)
            .build()
        nm.notify(task.hashCode(), n)
    }
}
