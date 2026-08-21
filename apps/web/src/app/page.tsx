import {
  BellIcon,
  CalendarDaysIcon,
  CameraIcon,
  CheckIcon,
  DocumentTextIcon,
  HeartIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { AppFooter } from "@/components/nav/app-footer";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function CameraIllustration() {
  return (
    <svg
      viewBox="0 0 320 260"
      className="h-auto w-full max-w-sm text-primary"
      aria-hidden="true"
    >
      <circle cx="160" cy="130" r="120" className="fill-muted/40" />
      <rect x="60" y="70" width="70" height="24" rx="6" className="fill-current" />
      <rect x="40" y="90" width="240" height="130" rx="18" className="fill-current" />
      <rect x="52" y="102" width="216" height="106" rx="10" className="fill-background" />
      <circle cx="160" cy="155" r="52" className="fill-current" />
      <circle cx="160" cy="155" r="36" className="fill-background" />
      <circle cx="160" cy="155" r="22" className="fill-current opacity-70" />
      <circle cx="232" cy="118" r="8" className="fill-background" />
    </svg>
  );
}

const PLANS = [
  {
    name: "Gratis",
    price: "$0",
    period: "para siempre",
    description: "Para empezar a ordenar tu estudio sin compromiso.",
    features: [
      "Clientes y reservas ilimitadas",
      "Hasta 5 facturas por mes",
      "Pagos manuales (efectivo, transferencia, Pago Móvil, Zelle)",
      "Recordatorios automáticos",
    ],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mes",
    description: "Para estudios que ya facturan a ritmo constante.",
    features: [
      "Todo lo del plan gratis",
      "Facturas ilimitadas",
      "Cobro online con Stripe",
      "Métodos VE: Pago Móvil, Zelle, Binance/USDT",
    ],
    cta: "Empezar con Pro",
    highlighted: true,
  },
];

const FAQS = [
  {
    question: "¿Necesito tarjeta para empezar?",
    answer: "No. El plan gratis no pide tarjeta — solo la necesitás si upgradeás a Pro.",
  },
  {
    question: "¿Funciona en Venezuela?",
    answer:
      "Sí. Además de Stripe para pagos internacionales, podés registrar pagos en Pago Móvil, Zelle, Binance/USDT y efectivo en bolívares.",
  },
  {
    question: "¿Puedo facturar en dólares y ver el equivalente en bolívares?",
    answer:
      "Sí, tus facturas quedan en USD y el sistema muestra el equivalente en Bs (oficial y paralelo) a la tasa del momento, actualizada varias veces al día.",
  },
  {
    question: "¿Qué pasa si supero el límite del plan gratis?",
    answer:
      "Todo lo demás sigue sin límite; para generar más de 5 facturas por mes necesitás pasar a Pro.",
  },
  {
    question: "¿Mis datos están aislados de otros estudios?",
    answer:
      "Sí, cada estudio tiene sus datos aislados a nivel de base de datos (Row Level Security), no solo a nivel de aplicación.",
  },
];

const FEATURES = [
  {
    icon: UsersIcon,
    title: "Clientes",
    description: "Toda la información de contacto y el historial de cada cliente en un solo lugar.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Reservas",
    description: "Agendá sesiones, asigná servicios y llevá el estado de cada reserva.",
  },
  {
    icon: DocumentTextIcon,
    title: "Facturas y pagos",
    description:
      "Generá facturas, cobrá online con Stripe o registrá pagos manuales — efectivo, transferencia, Pago Móvil, Zelle y más.",
  },
  {
    icon: BellIcon,
    title: "Recordatorios automáticos",
    description: "Nunca más te olvidés de cobrar: push y email automáticos antes del vencimiento.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Cargá clientes y servicios",
    description: "Sumá tu cartera de clientes y los servicios que ofrecés, una sola vez.",
  },
  {
    number: "2",
    title: "Reservá y facturá",
    description: "Agendá la sesión y generá la factura en el momento, con vencimiento automático.",
  },
  {
    number: "3",
    title: "Cobrá y olvidate del seguimiento",
    description: "Cobrá online o registrá el pago manual — los recordatorios avisan solos antes de vencer.",
  },
];

const AUDIENCES = [
  { icon: HeartIcon, title: "Bodas" },
  { icon: UserIcon, title: "Retratos" },
  { icon: SparklesIcon, title: "Eventos" },
  { icon: CameraIcon, title: "Producto" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-8">
        <span className="font-heading text-xl">Souvenirs</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Creá tu estudio</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-24 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="font-heading text-4xl leading-tight sm:text-5xl">
              Gestión de clientes y pagos, pensada para fotógrafos
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Clientes, reservas, facturas y cobros en un solo lugar — con recordatorios automáticos
              para que nunca se te escape un pago pendiente.
            </p>
            <div className="flex gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Empezar gratis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
          <CameraIllustration />
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="size-8 text-primary" />
                <CardTitle className="font-heading text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-3xl">Cómo funciona</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number} className="flex flex-col items-center gap-3 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-lg text-primary-foreground">
                    {step.number}
                  </span>
                  <h3 className="font-heading text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-24">
          <h2 className="text-center font-heading text-3xl">Tu panel, siempre a mano</h2>
          <Card className="mt-12 overflow-hidden py-0">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-primary/40" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            </div>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">María Fernández</TableCell>
                    <TableCell className="text-muted-foreground">450 USD</TableCell>
                    <TableCell><Badge>Pagada</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Carlos Rondón</TableCell>
                    <TableCell className="text-muted-foreground">300 USD</TableCell>
                    <TableCell><Badge variant="secondary">Enviada</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Estudio Luz</TableCell>
                    <TableCell className="text-muted-foreground">120 USD</TableCell>
                    <TableCell><Badge variant="destructive">Vencida</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-3xl">Para qué tipo de fotógrafo</h2>
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {AUDIENCES.map((audience) => (
                <div key={audience.title} className="flex flex-col items-center gap-2 text-center">
                  <audience.icon className="size-7 text-primary" />
                  <span className="font-medium">{audience.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-24">
          <h2 className="text-center font-heading text-3xl">Precios simples</h2>
          <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={plan.highlighted ? "border-primary" : undefined}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                    {plan.highlighted && <Badge>Popular</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <p className="pt-2">
                    <span className="font-heading text-3xl">{plan.price}</span>
                    <span className="text-sm text-muted-foreground"> {plan.period}</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.highlighted ? "default" : "outline"} asChild>
                    <Link href="/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-heading text-3xl">Preguntas frecuentes</h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center">
          <h2 className="font-heading text-3xl">¿Listo para ordenar tus cobros?</h2>
          <p className="text-muted-foreground">Creá tu estudio gratis, no hace falta tarjeta.</p>
          <Button size="lg" asChild>
            <Link href="/register">Empezar gratis</Link>
          </Button>
        </section>
      </main>

      <AppFooter variant="marketing" />
    </div>
  );
}
