"use client";

import { FormEvent } from "react";
import { saveBrain } from "@/lib/crypto";
import { setRoomAgentId } from "@/lib/agents";
import type { View } from "@/components/aeko-app-types";
import { CommandPalette } from "@/components/command-palette";
import { ActivityRail, NotificationDrawer } from "@/components/activity-rail";
import { InviteModal, RenameModal } from "@/components/modals";
import { WorkspaceSkeleton } from "@/components/workspace-skeleton";
import { BrainForm } from "@/components/brain-view";
import { ChatView } from "@/components/chat-view";
import { DeskView } from "@/components/desk-view";
import { WorkspaceRoot, WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
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
    <WorkspaceRoot>
      {ws.view === "desk" && (
        <WorkspaceShell
          sidebar={
            <WorkspaceSidebar
              userEmail={userEmail}
              brain={ws.brain}
              activeAgentId={ws.activeAgentId}
              busy={ws.busy}
              roomId={ws.roomId}
              deskSearch={ws.deskSearch}
              deskSearchRef={ws.deskSearchRef}
              filteredRooms={ws.filteredRooms}
              onAgentSelect={(id) => {
                ws.setActiveAgentId(id);
                if (ws.roomId) setRoomAgentId(ws.roomId, id);
              }}
              onDeskSearch={ws.setDeskSearch}
              onPalette={() => ws.setPaletteOpen(true)}
              onCreateTask={ws.createTask}
              onSettings={ws.goSettings}
              onOpenRoom={ws.openChat}
            />
          }
        >
          <div className="workspace-body">
            <DeskView
              userEmail={userEmail}
              brain={ws.brain}
              activeAgent={ws.activeAgent}
              rooms={ws.rooms}
              filteredRooms={ws.filteredRooms}
              featured={ws.featured}
              featuredPreview={ws.featuredPreview}
              previews={ws.previews}
              needsKey={ws.needsKey}
              durable={ws.durable}
              status={ws.status}
              deskDraft={ws.deskDraft}
              busy={ws.busy}
              webMode={ws.webMode}
              agentMode={ws.agentMode}
              localMode={ws.localMode}
              formatTime={formatTime}
              onDeskDraft={ws.setDeskDraft}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                ws.run(ws.deskDraft.trim(), true);
              }}
              onPalette={() => ws.setPaletteOpen(true)}
              onSettings={ws.goSettings}
              onCreateTask={ws.createTask}
              onInvite={() => ws.setShowInvite(true)}
              onOpenRoom={ws.openChat}
              onRunChip={(c) => ws.run(c, true)}
              onWebMode={() => ws.setWebMode((v) => !v)}
              onAgentMode={() => ws.setAgentMode((v) => !v)}
              onFile={(file) => void ws.attachVaultFile(file)}
            />
            <ActivityRail
              userEmail={userEmail}
              members={ws.members}
              typers={ws.typers}
              busy={ws.busy}
              activeAgentId={ws.activeAgentId}
              enginePhase={ws.enginePhase}
              notifications={ws.notifications}
              onOpenNotifications={() => ws.setNotifyOpen(true)}
            />
          </div>
        </WorkspaceShell>
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
    </WorkspaceRoot>
  );
}
