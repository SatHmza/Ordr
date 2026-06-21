import KitchenDisplay from '@/components/kitchen/KitchenDisplay'

interface Props {
  params: Promise<{ restaurantId: string }>
}

export default async function KitchenPage({ params }: Props) {
  const { restaurantId } = await params
  return <KitchenDisplay restaurantId={restaurantId} />
}
