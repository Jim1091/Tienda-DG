import { ArrowRight } from "lucide-react";

export type VisualCategory = { id: string; name: string; imageKey?: string | null };
type VisualProduct = { categoryId: string | null; imageUrl: string | null };

export function CategoryTiles({ categories, products, onChoose }: {
  categories: VisualCategory[];
  products: VisualProduct[];
  onChoose: (id: string) => void;
}) {
  return <div className="cat-grid">{categories.map(category => {
    const productImage = products.find(product => product.categoryId === category.id && product.imageUrl)?.imageUrl;
    const image = category.imageKey ? `/api/media/${category.imageKey}` : productImage;
    return <button className="category-photo-tile" key={category.id} onClick={() => onChoose(category.id)}>
      {image && <span className="category-photo" style={{ backgroundImage: `url(${image})` }}/>}<span className="category-shade"/>
      <span className="category-content"><span className="eyebrow">Explorar</span><strong>{category.name}</strong><span className="category-link">Descubrir <ArrowRight size={15}/></span></span>
    </button>;
  })}</div>;
}
