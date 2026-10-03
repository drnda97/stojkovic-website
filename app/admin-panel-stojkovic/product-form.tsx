import Link from "next/link";
import { hasWeight, type Filter, type Product } from "@/data/products";
import { ADMIN_PATH } from "@/lib/admin-auth";
import { saveProductAction } from "./actions";
import {
  buttonClass,
  fileClass,
  IMAGE_ACCEPT,
  IMAGE_HINT,
  cardClass,
  Checkbox,
  inputClass,
  labelClass,
  PageHeader,
  quietButtonClass,
  Thumb,
} from "./ui";

type ProductFormProps = {
  /** Proizvod koji se menja; bez njega forma dodaje novi. */
  product?: Product;
  filters: Filter[];
  error?: string;
};

const textareaClass = `${inputClass} min-h-[110px]`;

export function ProductForm({ product, filters, error }: ProductFormProps) {
  const backPath = `${ADMIN_PATH}/proizvodi`;

  return (
    <>
      <Link href={backPath} className="text-[14px] underline">
        ← Proizvodi
      </Link>
      <div className="mt-[12px]">
        <PageHeader title={product ? product.fullName : "Novi proizvod"} error={error} />
      </div>

      <form
        action={saveProductAction}
        className={`${cardClass} flex max-w-[680px] flex-col gap-[16px]`}
      >
        <input type="hidden" name="slug" value={product?.slug ?? ""} />

        <label className={labelClass}>
          Naziv (kratak, na kartici) *
          <input name="name" required defaultValue={product?.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          Pun naziv (naslov stranice, korpa) — ako je prazno, koristi se kratak
          <input name="fullName" defaultValue={product?.fullName} className={inputClass} />
        </label>
        <label className={labelClass}>
          Filter (dugme na strani „Sirevi“ pod kojim se proizvod prikazuje)
          <select
            name="category"
            defaultValue={product?.category ?? filters[0]?.id}
            className={inputClass}
          >
            {filters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[16px]">
          <label className={labelClass}>
            Cena (RSD)
            <input
              name="price"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.price ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Cena na akciji (RSD)
            <input
              name="salePrice"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.salePrice ?? ""}
              placeholder="nema akcije"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Gramaža (g)
            <input
              name="weight"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.weight ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-[10px] text-[15px]">
          <Checkbox name="noWeight" defaultChecked={product ? !hasWeight(product) : false} />
          Prodaje se bez gramaže (npr. paket)
        </label>

        <fieldset className="flex flex-col gap-[16px] rounded-[6px] border border-line p-[16px]">
          <legend className="px-[6px] text-[15px] font-medium text-ink">Stanje</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[16px]">
            <label className={labelClass}>
              Ručno stanje
              <select
                name="inStock"
                defaultValue={(product?.inStock ?? true) ? "yes" : "no"}
                className={inputClass}
              >
                <option value="yes">Na stanju</option>
                <option value="no">Nema na stanju</option>
              </select>
            </label>
            <label className={labelClass}>
              Broj komada na stanju
              <input
                name="stockQty"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.stockQty ?? ""}
                placeholder="ne vodi se"
                className={inputClass}
              />
            </label>
          </div>
          <p className="mt-[-8px] text-[14px] text-muted">
            Ako upišete broj komada, stanje se vodi samo: svaka porudžbina ga smanjuje, a na nuli
            proizvod postaje rasprodat. Dok je polje prazno, važi ručno stanje.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[16px]">
            <label className={labelClass}>
              Oznaka „pri kraju“ na sajtu
              <select
                name="lowStockMode"
                defaultValue={product?.lowStockMode ?? "off"}
                className={inputClass}
              >
                <option value="off">Ne prikazuj</option>
                <option value="always">Uvek prikazuj</option>
                <option value="auto">Sama, kada broj padne na prag</option>
              </select>
            </label>
            <label className={labelClass}>
              Prag (komada)
              <input
                name="lowStockThreshold"
                type="number"
                min="1"
                step="1"
                defaultValue={product?.lowStockThreshold ?? ""}
                className={inputClass}
              />
            </label>
          </div>
          <p className="mt-[-8px] text-[14px] text-muted">
            Prag važi samo uz upisan broj komada: sa pragom 5, kupac vidi „Još samo 5 kom.“ čim ih
            ostane pet ili manje.
          </p>
        </fieldset>

        <div className={labelClass}>
          Slika proizvoda ({IMAGE_HINT})
          <div className="flex flex-wrap items-center gap-[16px]">
            <Thumb src={product?.image} alt={product?.fullName ?? "Novi proizvod"} />
            <input
              type="file"
              name="image"
              accept={IMAGE_ACCEPT}
              aria-label="Slika proizvoda"
              className={fileClass}
            />
          </div>
          {product?.image && <span>Ako ne izaberete novu, ostaje trenutna slika.</span>}
        </div>

        <div className={labelClass}>
          Dodatne slike za galeriju na stranici proizvoda
          {(product?.gallery ?? []).length > 0 && (
            <div className="flex flex-wrap gap-[16px]">
              {(product?.gallery ?? []).map((src) => (
                <label
                  key={src}
                  className="flex cursor-pointer flex-col items-center gap-[6px] text-ink"
                >
                  <Thumb src={src} alt="" />
                  <span className="flex items-center gap-[6px] text-[13px]">
                    <Checkbox name="galleryRemove" value={src} />
                    Ukloni
                  </span>
                </label>
              ))}
            </div>
          )}
          <input
            type="file"
            name="gallery"
            accept={IMAGE_ACCEPT}
            multiple
            aria-label="Dodatne slike"
            className={fileClass}
          />
          <span>
            Možete izabrati više slika odjednom (zajedno do 15 MB). Na sajtu idu posle glavne slike,
            redom kojim su dodate; klik na malu sliku je prikazuje kao veliku. Dok proizvod nema
            dodatnih slika, ispod glavne stoje tri zajedničke iz dela Stranice → Stranica proizvoda.
          </span>
        </div>

        <label className={labelClass}>
          Kratak opis na kartici
          <input name="tagline" defaultValue={product?.tagline} className={inputClass} />
        </label>
        <label className={labelClass}>
          Uvodni pasus na stranici proizvoda
          <textarea name="intro" defaultValue={product?.intro} className={textareaClass} />
        </label>
        <label className={labelClass}>
          Opis
          <textarea
            name="description"
            defaultValue={product?.description}
            className={textareaClass}
          />
        </label>
        <label className={labelClass}>
          Sastojci
          <textarea
            name="ingredients"
            defaultValue={product?.ingredients}
            className={textareaClass}
          />
        </label>
        <label className={labelClass}>
          Uz šta ga služiti — jedan red po stavci, u obliku {'„Naslov: tekst"'}
          <textarea
            name="serving"
            defaultValue={product?.serving.map((item) => `${item.title}: ${item.text}`).join("\n")}
            className={textareaClass}
          />
        </label>

        <div className="flex flex-wrap gap-[12px] pt-[8px]">
          <button type="submit" className={buttonClass}>
            Sačuvaj
          </button>
          <Link href={backPath} className={quietButtonClass}>
            Odustani
          </Link>
        </div>
      </form>
    </>
  );
}
