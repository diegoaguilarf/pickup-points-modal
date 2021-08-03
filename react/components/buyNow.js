import React from "react"
import { useOrderForm } from 'vtex.order-manager/OrderForm';
import { useMutation } from 'react-apollo';
import UpdateSelectedAddressMutation from 'vtex.checkout-resources/MutationUpdateSelectedAddress';
import Button from './Button'

const buyNow = (props) => {
    const { confirmButtonId, moreClassName, title, selectedPickupPoint, onClick } = props;

    const { orderForm, setOrderForm } = useOrderForm();
    const [updateSelectedAddress] = useMutation(UpdateSelectedAddressMutation);
    
    
    const setPayloadInOrderForm = async (selectedPickupPoint) => {
        const response = await updateSelectedAddress({
          variables: {
            orderFormId: orderForm.id,
            address: {
              addressId: undefined,
              addressType: 'search',
              postalCode: selectedPickupPoint.pickupStoreInfo.address.postalCode,
              geoCoordinates: [
                parseFloat(selectedPickupPoint.pickupStoreInfo.address.geoCoordinates[0]),
                parseFloat(selectedPickupPoint.pickupStoreInfo.address.geoCoordinates[1])
              ],
              number: "",
              street: selectedPickupPoint.pickupStoreInfo.address.street,
              complement: "",
              receiverName: undefined,
              neighborhood: "",
              city: selectedPickupPoint.pickupStoreInfo.address.city,
              state: selectedPickupPoint.pickupStoreInfo.address.state,
              country: 'COL'
            }
          }
        })
        setOrderForm(response.data.updateSelectedAddress);
        return {}
      };

    const handleConfirmButtonClick = async () => {
        await setPayloadInOrderForm(selectedPickupPoint);
        onClick();
        window.location.href = `/checkout/#/shipping`;
    }

    return (
      <Button
        id={confirmButtonId}
        kind="primary"
        large
        moreClassName={moreClassName}
        onClick={handleConfirmButtonClick}
        title={title}
      />
    )
}

export default buyNow;