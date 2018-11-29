function products(parent, args, context, info) {
    return context.db.query.products({ where: { variantCode_in: parent.variantCodes } }, info)
  }
  
  module.exports = {
    products,
  }