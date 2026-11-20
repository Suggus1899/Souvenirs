import {
  ArrowDownTrayIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  CameraIcon,
  CheckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  HeartIcon,
  LinkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AppFooter } from "@/components/nav/app-footer";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Souvenirs — clientes, reservas y cobros para fotógrafos",
  description:
    "Agenda sesiones, factura por conceptos, envía a tu cliente un link de pago y deja que los recordatorios cobren por ti. Hecho para fotógrafos en Venezuela y Latinoamérica.",
};

/** Hero visual: a stylised invoice plus the reminder the client receives. Decorative only. */
function ProductPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto mb-12 w-full max-w-sm">
      <Card className="gap-0 py-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-heading text-lg">Factura #0042</p>
            <p className="text-xs text-muted-foreground">María Fernández · vence 30/11</p>
          </div>
          <Badge variant="secondary">Parcial</Badge>
        </div>
        <ul className="flex flex-col gap-2 px-5 py-4 text-sm">
          <li className="flex justify-between">
            <span>Cobertura de boda (8 h)</span>
            <span>USD 380,00</span>
          </li>
          <li className="flex justify-between">
            <span>Álbum impreso 30×30</span>
            <span>USD 120,00</span>
          </li>
          <li className="flex justify-between border-t border-border pt-2 font-medium">
            <span>Saldo pendiente</span>
            <span>USD 250,00</span>
          </li>
        </ul>
        <div className="flex gap-2 border-t border-border px-5 py-3">
          <span className="flex-1 rounded-md bg-primary px-3 py-1.5 text-center text-xs text-primary-foreground">
            Pagar con tarjeta
          </span>
          <span className="rounded-md border border-border px-3 py-1.5 text-xs">PDF</span>
        </div>
      </Card>
      <div className="absolute -bottom-16 left-4 flex max-w-64 items-start gap-2 rounded-lg border border-border bg-background p-3 text-xs shadow-md sm:-left-10">
        <BellAlertIcon className="size-5 shrink-0 text-primary" />
        <p>
          <span className="font-medium">Recordatorio enviado</span>
          <br />
          <span className="text-muted-foreground">La factura #0042 vence en 3 días.</span>
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: DocumentTextIcon,
    title: "Facturas por conceptos",
    description:
      "Sesión, horas extra, álbum, copias: cada concepto con su cantidad y precio. Numeración automática y PDF listo para enviar.",
  },
  {
    icon: LinkIcon,
    title: "Link de pago para tu cliente",
    description:
      "Tu cliente recibe la factura por email y la abre sin crear cuenta. Si conectas Stripe, paga con tarjeta en un clic.",
  },
  {
    icon: BellAlertIcon,
    title: "Recordatorios que cobran por ti",
    description:
      "Antes y después del vencimiento, tu cliente recibe un email y tú un aviso en el teléfono. Se detienen solos cuando te pagan.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Agenda con calendario",
    description:
      "Vista mensual de tus sesiones, aviso si dos reservas se pisan y recordatorio un día antes de cada sesión.",
  },
  {
    icon: CurrencyDollarIcon,
    title: "Pensado para cobrar en Venezuela",
    description:
      "Registra pagos por Pago Móvil, Zelle, Binance/USDT o efectivo en Bs, y ve cada monto en bolívares a tasa oficial y paralela.",
  },
  {
    icon: UserGroupIcon,
    title: "Trabaja en equipo",
    description:
      "Invita a tu asistente por email. Gestiona clientes, reservas y pagos; el plan, Stripe y el equipo quedan solo para ti.",
  },
];

const STEPS = [
  {
    title: "Agenda la sesión",
    description: "Carga el cliente y reserva la fecha. El calendario te avisa si ya tienes algo a esa hora.",
  },
  {
    title: "Envía la factura",
    description: "Agrega los conceptos y envíala: tu cliente recibe por email el detalle y el link para pagar.",
  },
  {
    title: "Deja que te paguen",
    description:
      "Los recordatorios hacen el seguimiento. Registra los pagos manuales o deja que Stripe los marque solo.",
  },
];

const PLANS = [
  {
    name: "Gratis",
    price: "$0",
    period: "para siempre",
    description: "Todo el producto, para estudios que están empezando.",
    features: [
      "Clientes, reservas y equipo ilimitados",
      "Hasta 5 facturas por mes",
      "Link de pago y cobro con Stripe",
      "Recordatorios por email y push",
      "Pago Móvil, Zelle, Binance/USDT y efectivo",
    ],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mes",
    description: "Para estudios que ya facturan a ritmo constante.",
    features: ["Todo lo del plan gratis", "Facturas ilimitadas", "Cancela cuando quieras desde el panel"],
    cta: "Empezar con Pro",
    highlighted: true,
  },
];

const FAQS = [
  {
    question: "¿Necesito tarjeta para empezar?",
    answer: "No. El plan gratis no pide tarjeta; solo la necesitas si pasas a Pro.",
  },
  {
    question: "¿Mi cliente necesita crear una cuenta para pagar?",
    answer:
      "No. Recibe un email con un link privado donde ve el detalle de la factura, el saldo pendiente y, si conectaste Stripe, un botón para pagar con tarjeta.",
  },
  {
    question: "¿Funciona en Venezuela?",
    answer:
      "Sí. Además de Stripe para pagos con tarjeta, puedes registrar pagos por Pago Móvil, Zelle, Binance/USDT y efectivo en dólares o bolívares.",
  },
  {
    question: "¿Puedo facturar en dólares y ver el equivalente en bolívares?",
    answer:
      "Sí. Las facturas quedan en la moneda que elijas y, si es USD, el panel muestra el equivalente en Bs a tasa oficial y paralela, actualizada varias veces al día.",
  },
  {
    question: "¿Cuándo se envían los recordatorios?",
    answer:
      "Por defecto, 3 días antes, el día del vencimiento y 3 días después. Puedes cambiarlo en Configuración, y dejan de enviarse en cuanto la factura queda pagada o cancelada.",
  },
  {
    question: "¿Mis datos están aislados de otros estudios?",
    answer:
      "Sí. Cada estudio está aislado a nivel de base de datos (Row Level Security de PostgreSQL), no solo en el código de la aplicación.",
  },
];

const AUDIENCES = [
  { icon: HeartIcon, title: "Bodas" },
  { icon: UserIcon, title: "Retratos" },
  { icon: SparklesIcon, title: "Eventos" },
  { icon: CameraIcon, title: "Producto" },
];

const NAV = [
  { href: "#funciones", label: "Funciones" },
  { href: "#precios", label: "Precios" },
  { href: "#preguntas", label: "Preguntas" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/" aria-label="Souvenirs, inicio">
            <Logo />
          </Link>
          <nav aria-label="Secciones" className="hidden gap-6 text-sm text-muted-foreground md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/register">Crea tu estudio</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_75%_40%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-16 pb-28 md:grid-cols-2 md:pt-20">
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
            <Badge variant="outline">Para fotógrafos en Venezuela y Latinoamérica</Badge>
            <h1 className="font-heading text-4xl leading-tight sm:text-5xl">
              Toma fotos. Nosotros nos encargamos de que te paguen.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Agenda sesiones, factura por conceptos y envía a tu cliente un link para pagar. Los
              recordatorios hacen el seguimiento por ti hasta que la factura quede saldada.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Empezar gratis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#como-funciona">Ver cómo funciona</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Gratis para siempre. Sin tarjeta.</p>
          </div>
          <ProductPreview />
          </div>
        </section>

        <section id="funciones" className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-heading text-3xl">Todo el cobro, en un solo lugar</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Deja la libreta, las notas del teléfono y los mensajes de «¿ya me pagaste?».
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <feature.icon className="size-8 text-primary" aria-hidden="true" />
                    <CardTitle className="font-heading text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-3xl">Cómo funciona</h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col items-center gap-3 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-lg text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="font-heading text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-3xl">Tu panel, siempre al día</h2>
              <ul className="flex flex-col gap-3 text-muted-foreground">
                {[
                  "Cuánto cobraste este mes y cuánto te deben, por moneda",
                  "Facturas vencidas marcadas solas, cada hora",
                  "Ficha de cada cliente con su saldo e historial",
                  "Exporta tus facturas a CSV para tu contador",
                  "App móvil para registrar pagos desde donde estés",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Card aria-hidden="true" className="gap-0 py-0">
              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  ["Cobrado este mes", "USD 2.340,00"],
                  ["Por cobrar", "USD 870,00"],
                  ["Facturas vencidas", "2"],
                  ["Sesiones esta semana", "5"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-background p-5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 font-heading text-2xl">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
                <ArrowDownTrayIcon className="size-4" />
                facturas.csv
              </div>
            </Card>
          </div>
        </section>

        <section className="px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-3xl">Para todo tipo de fotógrafo</h2>
            <ul className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {AUDIENCES.map((audience) => (
                <li key={audience.title} className="flex flex-col items-center gap-2 text-center">
                  <audience.icon className="size-7 text-primary" aria-hidden="true" />
                  <span className="font-medium">{audience.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="precios" className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-3xl">Precios simples</h2>
            <p className="mt-3 text-center text-muted-foreground">
              El plan gratis incluye todo el producto. Pro solo quita el límite de facturas.
            </p>
            <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
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
                          <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
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
          </div>
        </section>

        <section id="preguntas" className="scroll-mt-20 px-4 py-24">
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

        <section className="border-t border-border bg-muted/30 px-4 py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <ShieldCheckIcon className="size-10 text-primary" aria-hidden="true" />
            <h2 className="font-heading text-3xl">¿Listo para dejar de perseguir pagos?</h2>
            <p className="text-muted-foreground">Crea tu estudio en un minuto. Gratis, sin tarjeta.</p>
            <Button size="lg" asChild>
              <Link href="/register">Empezar gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      <AppFooter variant="marketing" />
    </div>
  );
}
