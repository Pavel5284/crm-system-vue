export interface IMenuItem {
  name: string
  url: string
  icon: string
  disabled?: boolean
}

export const MENU_DATA: IMenuItem[] = [
  { icon: "radix-icons:dashboard", name: "menu.home", url: "/" },
  { icon: "ep:goods", name: "menu.products", url: "/products", disabled: true },
  { icon: "ph:contactless-payment", name: "menu.payments", url: "/payments", disabled: true },
  { icon: "fluent:receipt-28-regular", name: "menu.orders", url: "/orders", disabled: true },
  { icon: "mingcute:group-line", name: "menu.customers", url: "/customers" },
  { icon: "lucide:messages-square", name: "menu.chats", url: "/chats" },
  { icon: "fluent:person-feedback-48-regular", name: "menu.feedback", url: "/feedback", disabled: true },
  { icon: "radix-icons:gear", name: "menu.settings", url: "/settings" },
  { icon: "radix-icons:question-mark", name: "menu.help", url: "/help", disabled: true },
]
