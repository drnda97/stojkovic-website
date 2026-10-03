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
