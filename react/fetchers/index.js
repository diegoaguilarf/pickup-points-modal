import { newAddress } from '../utils/newAddress'
import { PICKUP_IN_STORE, SEARCH } from '../constants'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { isDelivery } from '../utils/DeliveryChannelsUtils'

axiosRetry(axios, { retries: 2 })

export function fetchExternalPickupPoints(geoCoordinates) {
  return fetch(
    `/api/checkout/pub/pickup-points?geoCoordinates=${geoCoordinates[0]};${
      geoCoordinates[1]
    }&page=1&pageSize=100`
  ).then(response => response.json())
}

export function getAvailablePickups({
  logisticsInfo,
  salesChannel,
  orderFormId,
  pickupAddress,
}) {
  const pickupAddressWithAddressId = newAddress({
    ...pickupAddress,
    addressId: undefined,
    addressType: SEARCH,
  })

  const dataRequest = {
    orderFormId,
    shippingData: {
      selectedAddresses: [pickupAddressWithAddressId],
      logisticsInfo: logisticsInfo.map(li => ({
        addressId: pickupAddressWithAddressId.addressId,
        itemIndex: li.itemIndex,
        selectedDeliveryChannel: PICKUP_IN_STORE,
        selectedSla: null,
      })),
    },
  }

  return axios({
    url: `/api/checkout/pub/orderForms/simulation?sc=${salesChannel}&rnbBehavior=0`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(dataRequest),
  })
}

export function updateShippingData(
  residentialAddress,
  logisticsInfo,
  pickupPoint
) {
  const pickupAddress = pickupPoint.pickupStoreInfo
    ? pickupPoint.pickupStoreInfo.address
    : pickupPoint.address

  const hasGeocoordinates =
    pickupAddress && pickupAddress.geoCoordinates.length > 0

  const pickupAddressWithAddressId = newAddress({
    ...pickupAddress,
    addressId: pickupPoint.id,
    addressType: SEARCH,
  })
  const shippingData = {
    ...(hasGeocoordinates ? { clearAddressIfPostalCodeNotFound: false } : {}),
    selectedAddresses: [
      ...(residentialAddress ? [residentialAddress] : []),
      pickupAddressWithAddressId,
    ],
    logisticsInfo: logisticsInfo.map(li => {
      const slaSelected = li.slas.find(sla => sla.id.includes(pickupPoint.id))
      const hasDeliverySla = li.slas.some(sla => isDelivery(sla))

      return {
        slas: li.slas,
        itemIndex: parseInt(li.itemIndex),
        addressId: slaSelected ? pickupAddressWithAddressId.addressId : li.addressId,
        selectedSla: slaSelected ? slaSelected.id : li.selectedSla,
        selectedDeliveryChannel: "pickup-in-point"
          ? PICKUP_IN_STORE
          : hasDeliverySla
            ? li.selectedDeliveryChannel
            : null,
      }
    }),
  }
  return localStorage.setItem("current_pickup_point", JSON.stringify(shippingData))
}
