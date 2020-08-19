import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemTextPrice,
  AdittionalItemText,
  AdittionalItemPrice,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  formattedValue: string;
  quantity: number;
  valueTotal: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [foodTotal, setFoodTotal] = useState(0);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      let dataFavorites: Response;
      const { data: dataFood } = await api.get(`foods/${routeParams.id}`);

      const filterFood = {
        ...dataFood,
        formattedPrice: formatValue(dataFood.price),
        extras: dataFood.extras.map((extra: Extra) => {
          return {
            ...extra,
            quantity: 0,
            formattedValue: formatValue(extra.value),
            valueTotal: 0,
          };
        }),
      };

      try {
        dataFavorites = await api.get(`favorites/${routeParams.id}`);
      } catch (error) {}

      setFood(filterFood);
      setExtras(filterFood.extras);

      if (dataFavorites) {
        setIsFavorite(!isFavorite);
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const incrementExtra = extras.map(extra => {
      if (extra.id === id) {
        const quantity = extra.quantity + 1;
        return {
          ...extra,
          quantity,
          valueTotal: quantity * extra.value,
        };
      }
      return extra;
    });
    setExtras(incrementExtra);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const decrementExtra = extras.map(extra => {
      if (extra.id === id && extra.quantity >= 1) {
        const quantity = extra.quantity - 1;
        return {
          ...extra,
          quantity,
          valueTotal: quantity * extra.value,
        };
      }
      return extra;
    });
    setExtras(decrementExtra);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(foodQuantity >= 2 ? foodQuantity - 1 : foodQuantity);
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (!isFavorite) {
      await api.post('favorites', food);
    } else {
      await api.delete(`favorites/${food.id}`);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const totalExtras = extras.reduce((total, extra) => {
      return total + extra.valueTotal;
    }, 0);

    const totalFood =
      ((food.price ? food.price : 0) + totalExtras) * foodQuantity;

    setFoodTotal(totalFood);

    return formatValue(totalFood);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const data = {
      ...food,
      product_id: food.id,
      price: foodTotal,
      extras,
    };

    data.id = Math.floor(Math.random() * 65536);

    await api.post('orders', data);

    navigation.navigate('DashboardStack');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemTextPrice>
                <AdittionalItemText>{extra.name}</AdittionalItemText>
                <AdittionalItemPrice>
                  {extra.formattedValue}
                </AdittionalItemPrice>
              </AdittionalItemTextPrice>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
