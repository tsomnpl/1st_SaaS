import { GenerationStatus, IncidentSeverity, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enqueueAndSend, emailSettings } from "@/server/email";
import { recordIncident } from "@/server/incidents";
import { notifyAdmins, notifyUser } from "@/server/notifications";

function safeLog(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : "HOOK_FAILED";
  console.error(`[support-hook:${scope}] ${message.slice(0, 160)}`);
}

export async function onGenerationSettled(input: {
  userId: string;
  generationId: string;
  status: GenerationStatus;
  errorCode?: string;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    const failed = input.status === GenerationStatus.FAILED;
    const code = input.errorCode ?? "";
    await notifyUser({
      userId: input.userId,
      type: failed ? "GENERATION_FAILED" : "GENERATION_SUCCESS",
      title: failed ? "Génération non aboutie" : "Affiche prête",
      body: failed
        ? "La génération a échoué. Le Mint est recrédité si le ledger a enregistré le remboursement."
        : "Ton affiche est disponible dans l’historique.",
      href: "/history",
      dedupeKey: `generation:${input.generationId}:${input.status}`,
    });
    if (user?.email) {
      await enqueueAndSend({
        template: failed ? "GenerationFailed" : "GenerationSuccess",
        to: user.email,
        entityId: `${input.generationId}:${input.status}`,
        payload: { summary: failed ? "La génération n’a pas abouti." : "Ton affiche est prête." },
      });
    }
    if (failed) {
      const insufficient = code.includes("INSUFFICIENT_BALANCE");
      await recordIncident({
        type: insufficient ? "RODIUM_INSUFFICIENT_BALANCE" : code.includes("TIMEOUT") ? "GENERATION_TIMEOUT" : "GENERATION_FAILED",
        severity: insufficient ? IncidentSeverity.HIGH : IncidentSeverity.NORMAL,
        service: "generation",
        summary: insufficient ? "Solde image insuffisant pendant une génération." : "Génération échouée.",
        detail: code.slice(0, 180),
        userId: input.userId,
        generationId: input.generationId,
      });
      await notifyAdmins({
        type: "GENERATION_FAILED",
        title: "Génération échouée",
        body: insufficient ? "Solde image insuffisant." : "Une génération a échoué.",
        href: "/admin/monitoring",
        dedupeKey: `gen-fail:${input.generationId}`,
      });
    }
    if (!failed) {
      const generation = await prisma.generation.findUnique({ where: { id: input.generationId } });
      if (generation && generation.status === GenerationStatus.COMPLETED && !generation.outputUrl) {
        await recordIncident({
          type: "GENERATION_WITHOUT_OUTPUT",
          severity: IncidentSeverity.HIGH,
          service: "generation",
          summary: "Génération terminée sans image.",
          userId: input.userId,
          generationId: input.generationId,
        });
      }
    }
  } catch (error) {
    safeLog("generation", error);
  }
}

export async function onPaymentSettled(input: {
  userId: string;
  paymentId: string;
  status: PaymentStatus;
  credited: boolean;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (input.status === PaymentStatus.COMPLETED && input.credited) {
      await notifyUser({
        userId: input.userId,
        type: "PAYMENT_CONFIRMED",
        title: "Paiement confirmé",
        body: "Les Mints de l’offre ont été crédités.",
        href: "/dashboard",
        dedupeKey: `payment-ok:${input.paymentId}`,
      });
      if (user?.email) {
        await enqueueAndSend({
          template: "PaymentSuccess",
          to: user.email,
          entityId: input.paymentId,
          payload: { summary: "Paiement confirmé et Mints crédités." },
        });
      }
      return;
    }
    if (input.status === PaymentStatus.FAILED || input.status === PaymentStatus.CANCELLED) {
      await notifyUser({
        userId: input.userId,
        type: "PAYMENT_FAILED",
        title: "Paiement non confirmé",
        body: "Aucun Mint n’a été ajouté.",
        href: "/pricing",
        dedupeKey: `payment-fail:${input.paymentId}:${input.status}`,
      });
      if (user?.email) {
        await enqueueAndSend({
          template: "PaymentFailed",
          to: user.email,
          entityId: `${input.paymentId}:${input.status}`,
          payload: {},
        });
      }
      await recordIncident({
        type: "PAYMENT_FAILED",
        severity: IncidentSeverity.NORMAL,
        service: "payments",
        summary: "Paiement non confirmé.",
        userId: input.userId,
        paymentId: input.paymentId,
      });
      const admin = emailSettings().admin;
      if (admin) {
        await enqueueAndSend({
          template: "AdminAlert",
          to: admin,
          entityId: `pay-alert:${input.paymentId}:${input.status}`,
          payload: { subject: "Paiement problématique", summary: "Un paiement n’a pas été confirmé." },
        });
      }
    }
  } catch (error) {
    safeLog("payment", error);
  }
}
