"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { placeOrder } from "@/app/(checkout)/porudzbina/actions";
import { useCart } from "@/components/cart-provider";
import { Placeholder } from "@/components/placeholder";
import { hasWeight } from "@/data/products";
import { site } from "@/data/site";
import { getDelivery, getSubtotal, getTotal } from "@/lib/cart";
import { formatPrice, formatWeight } from "@/lib/format";
import { saveLastOrder } from "@/lib/last-order";
import {
  emptyCustomer,
  validateCustomer,
  type CustomerField,
  type OrderCustomer,
  type OrderErrors,
} from "@/lib/orders";

const fieldIds: Record<CustomerField, string> = {
  name: "ime",
  phone: "tel",
  email: "mejl",
  street: "ulica",
  city: "mesto",
  postalCode: "pb",
  note: "nap",
};

const fieldOrder: CustomerField[] = ["name", "phone", "email", "street", "city", "postalCode", "note"];

const labelClass = "text-[14px] text-muted";
const hintClass = "text-[14px] text-muted";

function inputClass(invalid: boolean) {
  return `min-h-[52px] w-full rounded-none border bg-field px-[16px] py-[12px] text-[16px] text-ink focus:outline-2 focus:outline-offset-1 focus:outline-brass ${
    invalid ? "border-ink" : "border-line-strong"
  }`;
}

export function Checkout() {
  const router = useRouter();
  const { lines, hydrated, clear } = useCart();
  const [customer, setCustomer] = useState<OrderCustomer>(emptyCustomer);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);

  const isEmpty = hydrated && lines.length === 0;

  // Sa praznom korpom nema šta da se poruči. Posle uspešne potvrde korpa se
  // prazni namerno, pa tada ne vraćamo na sireve nego idemo na „Hvala".
  useEffect(() => {
    if (isEmpty && !submitted.current) router.replace("/sirevi");
  }, [isEmpty, router]);

  if (!hydrated || lines.length === 0) {
    return <div className="min-h-[60vh]" />;
  }

  const subtotal = getSubtotal(lines);
  const delivery = getDelivery(subtotal);
  const total = getTotal(lines);

  function update(field: CustomerField, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function showErrors(next: OrderErrors) {
    setErrors(next);
    const firstInvalid = fieldOrder.find((field) => next[field]);
    if (firstInvalid) document.getElementById(fieldIds[firstInvalid])?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    const clientErrors = validateCustomer(customer);
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }

    startTransition(async () => {
      try {
        const result = await placeOrder({
          customer,
          items: lines.map((line) => ({ slug: line.product.slug, qty: line.qty })),
        });

        if (!result.ok) {
          showErrors(result.errors);
          setFormMessage(result.message ?? null);
          return;
        }

        submitted.current = true;
        saveLastOrder({ orderNumber: result.orderNumber, total: result.total });
        clear();
        router.push("/porudzbina/hvala");
      } catch {
        setFormMessage(
          "Porudžbina nije poslata. Proverite internet vezu i pokušajte ponovo, ili nas pozovite.",
        );
      }
    });
  }

  function field(name: CustomerField) {
    const id = fieldIds[name];
    const error = errors[name];
    return {
      id,
      name,
      value: customer[name],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-greska` : undefined,
      className: inputClass(Boolean(error)),
    };
  }

  function errorText(name: CustomerField) {
    const error = errors[name];
    if (!error) return null;
    return (
      <p id={`${fieldIds[name]}-greska`} className={hintClass}>
        {error}
      </p>
    );
  }

  return (
    <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] items-start gap-x-[72px] gap-y-[48px] px-[32px] pt-[56px] pb-[96px]">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[44px]">
        <div className="flex flex-col gap-[10px]">
          <div className="text-[12px] tracking-[0.2em] text-brass uppercase">Porudžbina</div>
          <h1 className="text-[length:clamp(40px,4.5vw,60px)] leading-[1.05]">Gde da pošaljemo?</h1>
          <p className="text-[16px] text-muted">
            Bez naloga i bez plaćanja unapred. Plaćate kuriru kada paket stigne.
          </p>
        </div>

        <div className="flex flex-col gap-[18px]">
          <h2 className="text-[28px]">Kontakt</h2>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="ime" className={labelClass}>
              Ime i prezime
            </label>
            <input
              {...field("name")}
              type="text"
              autoComplete="name"
              required
              onChange={(event) => update("name", event.target.value)}
            />
            {errorText("name")}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-[16px] gap-y-[18px]">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="tel" className={labelClass}>
                Telefon
              </label>
              <input
                {...field("phone")}
                type="tel"
                autoComplete="tel"
                placeholder="06x xxx xxxx"
                required
                onChange={(event) => update("phone", event.target.value)}
              />
              {errorText("phone")}
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="mejl" className={labelClass}>
                Email
              </label>
              <input
                {...field("email")}
                type="email"
                autoComplete="email"
                required
                onChange={(event) => update("email", event.target.value)}
              />
              {errorText("email")}
            </div>
          </div>
          <p className={hintClass}>
            Na ovaj broj vas zovemo da potvrdimo porudžbinu, a kurir da najavi dostavu. Na email stiže potvrda porudžbine.
          </p>
        </div>

        <div className="flex flex-col gap-[18px]">
          <h2 className="text-[28px]">Adresa za dostavu</h2>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="ulica" className={labelClass}>
              Ulica i broj
            </label>
            <input
              {...field("street")}
              type="text"
              autoComplete="street-address"
              required
              onChange={(event) => update("street", event.target.value)}
            />
            {errorText("street")}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-[16px] gap-y-[18px]">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="mesto" className={labelClass}>
                Mesto
              </label>
              <input
                {...field("city")}
                type="text"
                autoComplete="address-level2"
                required
                onChange={(event) => update("city", event.target.value)}
              />
              {errorText("city")}
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="pb" className={labelClass}>
                Poštanski broj
              </label>
              <input
                {...field("postalCode")}
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                onChange={(event) => update("postalCode", event.target.value)}
              />
              {errorText("postalCode")}
            </div>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="nap" className={labelClass}>
              Napomena za kurira (nije obavezno)
            </label>
            <textarea
              {...field("note")}
              rows={3}
              placeholder="Sprat, interfon, kada ste kod kuće…"
              onChange={(event) => update("note", event.target.value)}
            />
            {errorText("note")}
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <h2 className="text-[28px]">Plaćanje</h2>
          <label
            htmlFor="pouzece"
            className="flex cursor-pointer items-start gap-[14px] border border-ink bg-field px-[20px] py-[18px] text-[16px] text-ink"
          >
            <input
              id="pouzece"
              type="radio"
              name="placanje"
              defaultChecked
              className="mt-[3px] h-[20px] w-[20px] accent-ink"
            />
            <span>
              <span className="block">Plaćanje pouzećem</span>
              <span className="block text-[14px] text-muted">
                Gotovinom kuriru pri preuzimanju paketa.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-[14px]">
          {formMessage && (
            <p role="alert" className="text-[16px] text-ink">
              {formMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="flex min-h-[60px] cursor-pointer items-center justify-center bg-ink px-[32px] text-[14px] tracking-[0.14em] text-paper uppercase hover:bg-brass disabled:cursor-default disabled:hover:bg-ink"
          >
            Potvrdi porudžbinu
          </button>
          <p className={hintClass}>
            Potvrdom poručujete sa obavezom plaćanja pri preuzimanju. Javićemo se telefonom da
            potvrdimo porudžbinu i dan slanja.
          </p>
        </div>
      </form>

      <aside className="flex flex-col gap-[24px] bg-band p-[32px]">
        <h2 className="text-[28px]">Vaša porudžbina</h2>
        <div className="flex flex-col">
          {lines.map(({ product, qty }, index) => (
            <div
              key={product.slug}
              className={`flex items-center gap-[16px] border-t border-line-mid py-[16px] ${index === lines.length - 1 ? "border-b" : ""}`}
            >
              <Placeholder
                label="Foto"
                variant="mini"
                tone="dark"
                src={product.image}
                sizes="64px"
                className="h-[80px] w-[64px] shrink-0"
              />
              <div className="grow">
                <div className="font-serif text-[21px] leading-[1.2] font-medium">
                  {product.fullName}
                </div>
                <div className="text-[14px] text-muted">
                  {hasWeight(product) && `${formatWeight(product.weight)} · `}
                  {qty} kom
                </div>
              </div>
              <div className="text-[15px] whitespace-nowrap">
                {formatPrice(product.price === null ? null : product.price * qty)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-[8px] text-[16px]">
          <div className="flex justify-between">
            <span className="text-muted">Međuzbir</span>
            <span>{formatPrice(subtotal, "[IZNOS]")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Dostava</span>
            <span>{formatPrice(delivery, "[CENA DOSTAVE]")}</span>
          </div>
        </div>
        <div className="flex items-baseline justify-between border-t border-ink pt-[20px]">
          <span className="text-[18px]">Ukupno za plaćanje</span>
          <span className="font-serif text-[30px] font-medium">
            {formatPrice(total, "[UKUPNO]")}
          </span>
        </div>
        <p className="text-[14px] text-muted">
          Sir se šalje vakuumiran, u rashladnom pakovanju. Isporuka za {site.deliveryTime} radna
          dana.
        </p>
      </aside>
    </section>
  );
}
