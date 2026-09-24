"use client";

import { FormEvent, useEffect, useState } from "react";
import { WORKSPACE_NAME_KEY, WORKSPACE_PURPOSE_KEY } from "@/lib/setup-draft";
import { saveBrain } from "@/lib/crypto";
import { setRoomAgentId } from "@/lib/agents";
import type { View } from "@/components/aeko-app-types";
import { CommandPalette } from "@/components/command-palette";
import { NotificationDrawer } from "@/components/activity-rail";
import { InviteModal, RenameModal } from "@/components/modals";
import { WorkspaceSkeleton } from "@/components/workspace-skeleton";
import { BrainForm } from "@/components/brain-view";
import { ChatView } from "@/components/chat-view";
import { DeskView } from "@/components/desk-view";
import { FloraShell, type FloraTab } from "@/components/flora-shell";
import { formatTime, useAekoWorkspace } from "@/hooks/use-aeko-workspace";

export function AekoApp({
  userEmail,
  initialRoomId,
  initialView = "desk",
}: {
  userEmail: string;
  initialRoomId?: string;
  initialView?: View;
}) {
  const ws = useAekoWorkspace(userEmail, initialRoomId, initialView);
  const [tab, setTab] = useState<FloraTab>("Home");
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [workspaceHint, setWorkspaceHint] = useState("");
  useEffect(() => {
    if (!ws.ready) return;
    const read = () => {
      const saved = localStorage.getItem(WORKSPACE_NAME_KEY);
      const purpose = localStorage.getItem(WORKSPACE_PURPOSE_KEY);
      if (saved) setWorkspaceName(saved);
      setWorkspaceHint(purpose || "");
    };
    read();
    window.addEventListener("aeko-workspace-change", read);
    return () => window.removeEventListener("aeko-workspace-change", read);
  }, [ws.ready]);

  if (!ws.ready || !ws.brain) return <WorkspaceSkeleton />;

  if (ws.view === "brain") {
    return (
      <BrainForm
        userEmail={userEmail}
        initial={ws.brain}
        onBack={() => {
          ws.setView("desk");
          ws.router.push("/");
        }}
        onDone={async (cfg) => {
          await saveBrain(cfg);
          ws.setBrain(cfg);
          ws.setView("desk");
          ws.router.push("/");
        }}
      />
    );
  }

  return (
    <FloraShell
      title={ws.view === "chat" ? ws.current || "Untitled" : workspaceName}
      hint={ws.view === "chat" ? undefined : workspaceHint}
      userEmail={userEmail}
      brainOk={ws.brain.valid}
      taskCount={ws.notifications.length}
      active={tab}
      onActive={(next) => {
        setTab(next);
        if (ws.view === "chat") ws.backToDesk();
      }}
      onShare={() => ws.setShowInvite(true)}
      onSearch={() => ws.setPaletteOpen(true)}
      onSettings={ws.goSettings}
      onCreateChannel={ws.createChannel}
      onNotify={() => ws.setNotifyOpen(true)}
    >
      {ws.view === "desk" && (
        <DeskView
          activeAgent={ws.activeAgent}
          filteredRooms={ws.filteredRooms}
          previews={ws.previews}
          needsKey={ws.needsKey}
          durable={ws.durable}
          status={ws.status}
          deskDraft={ws.deskDraft}
          busy={ws.busy}
          webMode={ws.webMode}
          agentMode={ws.agentMode}
          formatTime={formatTime}
          onDeskDraft={ws.setDeskDraft}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            ws.run(ws.deskDraft.trim(), true);
          }}
          onPalette={() => ws.setPaletteOpen(true)}
          onSettings={ws.goSettings}
          onCreateTask={ws.createTask}
          onOpenRoom={ws.openChat}
          onRunChip={(c) => ws.run(c, true)}
          onWebMode={() => ws.setWebMode((v) => !v)}
          onAgentMode={() => ws.setAgentMode((v) => !v)}
          onFile={(file) => void ws.attachVaultFile(file)}
          onCreateChannel={ws.createChannel}
          tab={tab}
          onTab={setTab}
          onAgentSelect={(id) => {
            ws.setActiveAgentId(id);
            if (ws.roomId) setRoomAgentId(ws.roomId, id);
          }}
          roomId={ws.roomId}
        />
      )}
      {ws.view === "chat" && (
        <ChatView
          current={ws.current}
          roomId={ws.roomId}
          brain={ws.brain}
          activeAgent={ws.activeAgent}
          members={ws.members}
          messages={ws.messages}
          draft={ws.draft}
          busy={ws.busy}
          codeMode={ws.codeMode}
          agentMode={ws.agentMode}
          webMode={ws.webMode}
          showAttach={ws.showAttach}
          enginePhase={ws.enginePhase}
          sheet={ws.sheet}
          bodyRef={ws.bodyRef}
          onBack={ws.backToDesk}
          onRename={() => {
            ws.setRenameValue(ws.current);
            ws.setRenameOpen(true);
          }}
          onDelete={() => ws.roomId && void ws.deleteTask(ws.roomId)}
          onCodeMode={() => ws.setCodeMode((v) => !v)}
          onAgentMode={() => ws.setAgentMode((v) => !v)}
          onSettings={ws.goSettings}
          onStop={() => ws.abortRef.current?.abort()}
          onDraft={ws.setDraft}
          onTyping={ws.pingTyping}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            ws.run(ws.draft.trim());
          }}
          onSend={() => ws.run(ws.draft.trim())}
          onRunChip={(c) => ws.run(c)}
          onShowAttach={() => ws.setShowAttach((v) => !v)}
          onWebMode={() => ws.setWebMode((v) => !v)}
          onFile={(file) => void ws.attachVaultFile(file, true)}
          onContextMenu={ws.setSheet}
          onCloseSheet={() => ws.setSheet(null)}
          onReply={ws.replyTo}
          reactions={ws.reactions}
          replyParent={ws.replyParent}
          onReact={(id, emoji) => void ws.reactTo(id, emoji)}
          onClearReply={() => ws.setReplyParent(null)}
          onShareRecord={(text) => void ws.shareRecord(text)}
          onCopy={(line) => {
            navigator.clipboard.writeText(line.text);
            ws.setSheet(null);
          }}
          onRegenerate={ws.regenerateFrom}
        />
      )}
      <InviteModal
        open={ws.showInvite}
        email={ws.invite}
        role={ws.inviteRole}
        onEmail={ws.setInvite}
        onRole={ws.setInviteRole}
        onClose={() => ws.setShowInvite(false)}
        onSubmit={() => void ws.addPerson()}
      />
      <RenameModal
        open={ws.renameOpen}
        title="Rename task"
        value={ws.renameValue}
        onChange={ws.setRenameValue}
        onClose={() => ws.setRenameOpen(false)}
        onSubmit={() => {
          if (ws.roomId) void ws.renameTask(ws.roomId, ws.renameValue);
          ws.setRenameOpen(false);
        }}
      />
      <NotificationDrawer open={ws.notifyOpen} items={ws.notifications} onClose={() => ws.setNotifyOpen(false)} />
      <CommandPalette open={ws.paletteOpen} onClose={() => ws.setPaletteOpen(false)} actions={ws.paletteActions} />
    </FloraShell>
  );
}
