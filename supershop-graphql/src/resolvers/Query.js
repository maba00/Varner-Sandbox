async function feed(parent, args, context, info) {
    const where = args.filter
    ? {
        OR: [
          { url_contains: args.filter },
          { description_contains: args.filter },
        ],
      }
    : {}
    // 1
    const queriedLinks = await context.db.query.links(
        { where, skip: args.skip, first: args.first, orderBy: args.orderBy },
        `{ id }`,
    )

    // 2
    const countSelectionSet = `
        {
            aggregate { count }
        }
    `
    const linksConnection = await context.db.query.linksConnection({}, countSelectionSet)
    // 3
    return {
        count: linksConnection.aggregate.count,
        linkIds: queriedLinks.map(link => link.id),
    }
}

async function variants(parent, args, context, info) {
    const where = args.filter
    ? {
        OR: [
          { productionCountry_contains: args.filter },
          { category_contains: args.filter },
        ],
      }
    : {}
    // 1
    const queriedProducts = await context.db.query.products(
        { where, skip: args.skip, first: args.first, orderBy: args.orderBy },
        `{ variantCode }`,
    )

    // 2
    const countSelectionSet = `
        {
            aggregate { count }
        }
    `
    const productsConnection = await context.db.query.productsConnection({}, countSelectionSet)
    // 3
    return {
        count: productsConnection.aggregate.count,
        variantCodes: queriedProducts.map(product => product.variantCode),
    }
}

  
  module.exports = {
    feed,
    variants
  }