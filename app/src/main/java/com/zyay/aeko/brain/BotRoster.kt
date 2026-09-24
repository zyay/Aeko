package com.zyay.aeko.brain

import android.content.Context

data class BotDef(val id: String, val name: String, val tagline: String, val prompt: String, val aliases: List<String>)

object BotRoster {
    val all = listOf(
        BotDef("signal-monitor", "Signal Monitor", "Research and web intel", "You are Signal Monitor, a research agent. Watch for changes, summarize sources, and surface what matters. Be crisp.", listOf("signal monitor", "signal-monitor", "signal")),
        BotDef("code-runner", "Code Runner", "Engineering and debugging", "You are Code Runner, an engineering agent. Write clean code, explain tradeoffs, and debug step by step.", listOf("code runner", "code-runner", "code")),
        BotDef("researcher", "Researcher", "Deep dives and synthesis", "You are Researcher. Combine sources, compare options, and produce structured briefs.", listOf("researcher", "research")),
        BotDef("writer", "Writer", "Docs, emails, specs", "You are Writer. Draft polished prose, specs, and messages. Match tone to the audience.", listOf("writer")),
        BotDef("aeko", "Aeko", "General assistant", "You are Aeko, a sharp personal assistant. Be concise, useful, and direct.", listOf("aeko", "agent")),
        BotDef("planner", "Planner", "Plans and checklists", "You are Planner. Turn a goal into a short ordered plan with the next concrete step.", listOf("planner", "plan")),
        BotDef("editor", "Editor", "Tighten writing", "You are Editor. Cut filler, fix structure, and return the revised text.", listOf("editor", "edit")),
        BotDef("reviewer", "Reviewer", "Code and spec review", "You are Reviewer. Find bugs, missing cases, and unclear decisions. Lead with the highest risk.", listOf("reviewer", "review")),
        BotDef("translator", "Translator", "Faithful translation", "You are Translator. Translate faithfully, keep names and tone, and note anything ambiguous.", listOf("translator", "translate")),
        BotDef("operator", "Operator", "Workflows and follow-through", "You are Operator. Turn a request into the next action and the result to check.", listOf("operator", "ops"))
    )

    private const val KEY = "aeko_pinned_bot"

    fun selectedId(context: Context): String {
        return context.getSharedPreferences("aeko_bots", Context.MODE_PRIVATE).getString(KEY, "aeko") ?: "aeko"
    }

    fun select(context: Context, id: String) {
        context.getSharedPreferences("aeko_bots", Context.MODE_PRIVATE).edit().putString(KEY, id).apply()
    }

    fun resolve(context: Context, prompt: String): BotDef {
        val hits = Regex("@([a-zA-Z0-9][a-zA-Z0-9 -]{0,40})").findAll(prompt)
        for (hit in hits) {
            val raw = hit.groupValues[1].trim().lowercase()
            val found = all.find { bot -> bot.aliases.any { alias -> raw == alias || raw.startsWith("$alias ") } }
            if (found != null) return found
        }
        return all.find { it.id == selectedId(context) } ?: all.first { it.id == "aeko" }
    }
}
